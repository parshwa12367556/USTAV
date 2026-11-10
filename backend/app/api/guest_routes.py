import csv
from io import StringIO
from datetime import datetime, timedelta, timezone

from flask import Blueprint, Response, current_app, request
from flask_jwt_extended import get_jwt, get_jwt_identity, jwt_required
from marshmallow import Schema, ValidationError, fields, validate
from werkzeug.datastructures import FileStorage

from app.core.exceptions import ApiError
from app.extensions import db
from app.models.event import Event, Function
from app.models.guest import Guest, GuestFunctionMapping, GuestGroup
from app.schemas.guest_schema import GuestGroupSchema, GuestSchema, normalize_phone
from app.models.workspace import FamilyWorkspace, FamilyMembership
from app.services.security_event_service import record_security_event
from app.services.workspace_service import require_event_permission
from app.utils.csv_parser import parse_guest_csv
from app.utils.token_security import generate_bearer_token, hash_bearer_token

guest_bp = Blueprint("guests", __name__)
guest_schema = GuestSchema()
guest_group_schema = GuestGroupSchema()


class GuestFunctionsSchema(Schema):
    functionIds = fields.List(
        fields.String(),
        required=True,
        validate=validate.Length(min=1, max=100),
    )


guest_functions_schema = GuestFunctionsSchema()


def _owned_event(event_id: str, permission: str = "guest.view") -> Event:
    event = db.session.get(Event, event_id)
    return require_event_permission(
        get_jwt_identity(), event, permission, get_jwt().get("membership_id")
    )


def _workspace_id(event: Event) -> str | None:
    return db.session.scalar(
        db.select(FamilyWorkspace.id).where(FamilyWorkspace.owner_user_id == event.owner_id)
    )


@guest_bp.get("/events/<event_id>/guests")
@jwt_required()
def list_guests(event_id: str):
    event = _owned_event(event_id)
    guests = db.session.scalars(
        db.select(Guest).where(Guest.event_id == event.id).order_by(Guest.name)
    ).all()
    return [guest.to_dict() for guest in guests]


@guest_bp.get("/events/<event_id>/guests/export.csv")
@jwt_required()
def export_guests(event_id: str):
    event = _owned_event(event_id, "guest.view")
    membership = db.session.scalar(
        db.select(FamilyMembership).where(
            FamilyMembership.workspace_id == event.owner_id,
            FamilyMembership.user_id == get_jwt_identity(),
        )
    )
    is_owner = membership and membership.role == "family_owner"
    guests = db.session.scalars(
        db.select(Guest).where(Guest.event_id == event.id).order_by(Guest.name)
    ).all()
    output = StringIO(newline="")
    writer = csv.writer(output)
    writer.writerow(["Name", "Group", "Email", "Phone", "RSVP"])
    writer.writerows(
        [
            guest.name,
            guest.group.name if guest.group else "",
            guest.email if is_owner else "",
            guest.phone if is_owner else "",
            guest.rsvp_status,
        ]
        for guest in guests
    )
    record_security_event(
        "guest.exported",
        "succeeded",
        user_id=get_jwt_identity(),
        resource_type="event",
        resource_id=event.id,
        metadata={"workspace_id": _workspace_id(event), "exported_count": len(guests)},
    )
    db.session.commit()
    return Response(
        "\ufeff" + output.getvalue(),
        mimetype="text/csv",
        headers={"Content-Disposition": 'attachment; filename="utsav-guest-list.csv"'},
    )


@guest_bp.post("/events/<event_id>/guests")
@jwt_required()
def create_guest(event_id: str):
    event = _owned_event(event_id, "guest.create")
    payload = guest_schema.load(request.get_json(silent=True) or {})
    if payload.get("plusOnes", 0) + 1 > payload.get("maxAttendees", 21):
        raise ValidationError({"plusOnes": ["The attendee count exceeds this invitation's limit."]})
    group = None
    group_name = payload.get("group")
    if group_name:
        group = db.session.scalar(
            db.select(GuestGroup).where(
                GuestGroup.event_id == event.id,
                GuestGroup.name == group_name.strip(),
            )
        )
        if group is None:
            group = GuestGroup(event_id=event.id, name=group_name.strip())
            db.session.add(group)
            db.session.flush()
    guest = Guest(
        event_id=event.id,
        group_id=group.id if group else None,
        name=payload["name"].strip(),
        phone=normalize_phone(payload.get("phone")),
        email=(payload.get("email") or "").strip() or None,
        max_attendees=payload.get("maxAttendees", 21),
        plus_ones=payload.get("plusOnes", 0),
    )
    db.session.add(guest)
    db.session.flush()
    record_security_event(
        "guest.created",
        "succeeded",
        user_id=get_jwt_identity(),
        resource_type="guest",
        resource_id=guest.id,
        metadata={"workspace_id": _workspace_id(event), "event_id": event.id},
    )
    db.session.commit()
    return guest.to_dict(), 201


@guest_bp.get("/events/<event_id>/guest-groups")
@jwt_required()
def list_guest_groups(event_id: str):
    event = _owned_event(event_id)
    groups = db.session.scalars(
        db.select(GuestGroup)
        .where(GuestGroup.event_id == event.id)
        .order_by(GuestGroup.name)
    ).all()
    return [
        {
            "id": group.id,
            "name": group.name,
            "guestCount": len(group.guests),
        }
        for group in groups
    ]


@guest_bp.post("/events/<event_id>/guest-groups")
@jwt_required()
def create_guest_group(event_id: str):
    event = _owned_event(event_id, "guest.create")
    payload = guest_group_schema.load(request.get_json(silent=True) or {})
    name = payload["name"].strip()
    if db.session.scalar(
        db.select(GuestGroup.id).where(
            GuestGroup.event_id == event.id,
            db.func.lower(GuestGroup.name) == name.lower(),
        )
    ):
        raise ApiError("A guest group with this name already exists.", 409)
    group = GuestGroup(event_id=event.id, name=name)
    db.session.add(group)
    db.session.commit()
    return {"id": group.id, "name": group.name, "guestCount": 0}, 201


@guest_bp.patch("/guest-groups/<group_id>")
@jwt_required()
def update_guest_group(group_id: str):
    group = db.session.get(GuestGroup, group_id)
    if group is None:
        raise ApiError("Guest group not found.", 404)
    require_event_permission(
        get_jwt_identity(), group.event, "guest.update", get_jwt().get("membership_id")
    )
    payload = guest_group_schema.load(request.get_json(silent=True) or {})
    name = payload["name"].strip()
    duplicate = db.session.scalar(
        db.select(GuestGroup.id).where(
            GuestGroup.event_id == group.event_id,
            db.func.lower(GuestGroup.name) == name.lower(),
            GuestGroup.id != group.id,
        )
    )
    if duplicate:
        raise ApiError("A guest group with this name already exists.", 409)
    group.name = name
    db.session.commit()
    return {"id": group.id, "name": group.name, "guestCount": len(group.guests)}


@guest_bp.delete("/guest-groups/<group_id>")
@jwt_required()
def delete_guest_group(group_id: str):
    group = db.session.get(GuestGroup, group_id)
    if group is None:
        raise ApiError("Guest group not found.", 404)
    require_event_permission(
        get_jwt_identity(), group.event, "guest.delete", get_jwt().get("membership_id")
    )
    db.session.execute(
        db.update(Guest)
        .where(Guest.group_id == group.id)
        .values(group_id=None)
    )
    db.session.delete(group)
    db.session.commit()
    return "", 204


@guest_bp.post("/events/<event_id>/guests/import-csv")
@jwt_required()
def import_guests(event_id: str):
    event = _owned_event(event_id, "guest.create")
    uploaded: FileStorage | None = request.files.get("file")
    if uploaded is None or not uploaded.filename:
        raise ApiError("A CSV file is required.")
    if not uploaded.filename.lower().endswith(".csv"):
        raise ApiError("Only CSV files are accepted.")
    try:
        rows = parse_guest_csv(uploaded.stream.read().decode("utf-8-sig"))
    except (UnicodeDecodeError, ValueError) as error:
        raise ApiError(str(error)) from error
    validated_rows = [guest_schema.load(row) for row in rows]
    if any(row.get("plusOnes", 0) + 1 > row.get("maxAttendees", 21) for row in validated_rows):
        raise ValidationError({"guests": ["An imported attendee count exceeds its invitation limit."]})
    guests = [
        Guest(
            event_id=event.id,
            name=row["name"].strip(),
            email=(row.get("email") or "").strip() or None,
            phone=normalize_phone(row.get("phone")),
            max_attendees=row.get("maxAttendees", 21),
            plus_ones=row.get("plusOnes", 0),
        )
        for row in validated_rows
    ]
    db.session.add_all(guests)
    record_security_event(
        "guest.imported",
        "succeeded",
        user_id=get_jwt_identity(),
        resource_type="event",
        resource_id=event.id,
        metadata={"workspace_id": _workspace_id(event), "imported_count": len(guests)},
    )
    db.session.commit()
    return {"imported": len(guests), "guests": [guest.to_dict() for guest in guests]}, 201


@guest_bp.patch("/guests/<guest_id>")
@jwt_required()
def update_guest(guest_id: str):
    guest = db.session.get(Guest, guest_id)
    if guest is None:
        raise ApiError("Guest not found.", 404)
    require_event_permission(
        get_jwt_identity(), guest.event, "guest.update", get_jwt().get("membership_id")
    )
    payload = guest_schema.load(request.get_json(silent=True) or {}, partial=True)
    for key, value in payload.items():
        if key == "group":
            group = db.session.scalar(
                db.select(GuestGroup).where(
                    GuestGroup.event_id == guest.event_id,
                    GuestGroup.name == value.strip(),
                )
            ) if value else None
            if value and group is None:
                group = GuestGroup(event_id=guest.event_id, name=value.strip())
                db.session.add(group)
                db.session.flush()
            guest.group_id = group.id if group else None
        elif key == "plusOnes":
            guest.plus_ones = value
        elif key == "maxAttendees":
            if guest.rsvp_status == "attending" and guest.plus_ones + 1 > value:
                raise ValidationError({"maxAttendees": ["The limit cannot be lower than the current RSVP count."]})
            guest.max_attendees = value
        elif key == "phone":
            guest.phone = normalize_phone(value)
        elif key == "email":
            guest.email = value.strip() or None
        else:
            setattr(guest, key, value.strip() if isinstance(value, str) else value)
    record_security_event(
        "guest.updated",
        "succeeded",
        user_id=get_jwt_identity(),
        resource_type="guest",
        resource_id=guest.id,
        metadata={"workspace_id": _workspace_id(guest.event), "event_id": guest.event_id},
    )
    db.session.commit()
    return guest.to_dict()


@guest_bp.get("/guests/<guest_id>/functions")
@jwt_required()
def list_guest_functions(guest_id: str):
    guest = db.session.get(Guest, guest_id)
    if guest is None:
        raise ApiError("Guest not found.", 404)
    require_event_permission(
        get_jwt_identity(), guest.event, "guest.view", get_jwt().get("membership_id")
    )
    function_ids = [mapping.function_id for mapping in guest.function_mappings]
    if not function_ids:
        function_ids = [function.id for function in guest.event.functions]
    return {"functionIds": function_ids}


@guest_bp.put("/guests/<guest_id>/functions")
@jwt_required()
def update_guest_functions(guest_id: str):
    guest = db.session.get(Guest, guest_id)
    if guest is None:
        raise ApiError("Guest not found.", 404)
    require_event_permission(
        get_jwt_identity(), guest.event, "guest.update", get_jwt().get("membership_id")
    )
    function_ids = guest_functions_schema.load(request.get_json(silent=True) or {})["functionIds"]
    if len(function_ids) != len(set(function_ids)):
        raise ValidationError({"functionIds": ["A function can only be selected once."]})

    functions = db.session.scalars(
        db.select(Function).where(
            Function.event_id == guest.event_id,
            Function.id.in_(function_ids),
        )
    ).all()
    if len(functions) != len(function_ids):
        raise ValidationError({"functionIds": ["Every selected function must belong to this event."]})

    db.session.execute(
        db.delete(GuestFunctionMapping).where(GuestFunctionMapping.guest_id == guest.id)
    )
    db.session.add_all(
        GuestFunctionMapping(guest_id=guest.id, function_id=function.id)
        for function in functions
    )
    record_security_event(
        "guest.functions_updated",
        "succeeded",
        user_id=get_jwt_identity(),
        resource_type="guest",
        resource_id=guest.id,
        metadata={"workspace_id": _workspace_id(guest.event), "event_id": guest.event_id},
    )
    db.session.commit()
    return {"functionIds": [function.id for function in functions]}


@guest_bp.delete("/guests/<guest_id>")
@jwt_required()
def delete_guest(guest_id: str):
    guest = db.session.get(Guest, guest_id)
    if guest is None:
        raise ApiError("Guest not found.", 404)
    require_event_permission(
        get_jwt_identity(), guest.event, "guest.delete", get_jwt().get("membership_id")
    )
    record_security_event(
        "guest.deleted",
        "succeeded",
        user_id=get_jwt_identity(),
        resource_type="guest",
        resource_id=guest.id,
        metadata={"workspace_id": _workspace_id(guest.event), "event_id": guest.event_id},
    )
    db.session.delete(guest)
    db.session.commit()
    return "", 204


@guest_bp.post("/guests/<guest_id>/invitation-token/rotate")
@jwt_required()
def rotate_guest_invitation_token(guest_id: str):
    guest = db.session.get(Guest, guest_id)
    if guest is None:
        raise ApiError("Guest not found.", 404)
    require_event_permission(
        get_jwt_identity(), guest.event, "guest.update", get_jwt().get("membership_id")
    )
    token = generate_bearer_token()
    guest.invitation_token_hash = hash_bearer_token(token)
    # Preserve revocation state - if previously revoked, remain revoked
    was_revoked = guest.invitation_revoked_at is not None
    if was_revoked:
        guest.invitation_revoked_at = datetime.now(timezone.utc)
    else:
        guest.invitation_revoked_at = None
    guest.invitation_expires_at = datetime.now(timezone.utc) + timedelta(
        days=current_app.config["INVITATION_TOKEN_EXPIRY_DAYS"]
    )
    record_security_event(
        "guest.invitation_token_rotated",
        "succeeded",
        user_id=get_jwt_identity(),
        resource_type="guest",
        resource_id=guest.id,
        metadata={"workspace_id": _workspace_id(guest.event), "event_id": guest.event_id},
    )
    db.session.commit()
    return {
        "guestId": guest.id,
        "invitationToken": token,
        "expiresAt": guest.invitation_expires_at.isoformat(),
    }


@guest_bp.post("/guests/<guest_id>/invitation-token/revoke")
@jwt_required()
def revoke_guest_invitation_token(guest_id: str):
    guest = db.session.get(Guest, guest_id)
    if guest is None:
        raise ApiError("Guest not found.", 404)
    require_event_permission(
        get_jwt_identity(), guest.event, "guest.update", get_jwt().get("membership_id")
    )
    now = datetime.now(timezone.utc)
    guest.invitation_revoked_at = now
    guest.invitation_expires_at = now
    record_security_event(
        "guest.invitation_revoked",
        "succeeded",
        user_id=get_jwt_identity(),
        resource_type="guest",
        resource_id=guest.id,
        metadata={"workspace_id": _workspace_id(guest.event), "event_id": guest.event_id},
    )
    db.session.commit()
    return {"guestId": guest.id, "revoked": True}
