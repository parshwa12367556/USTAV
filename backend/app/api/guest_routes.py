from datetime import datetime, timedelta, timezone
from secrets import token_urlsafe

from flask import Blueprint, current_app, request
from flask_jwt_extended import get_jwt_identity, jwt_required
from werkzeug.datastructures import FileStorage

from app.core.exceptions import ApiError
from app.extensions import db
from app.models.event import Event
from app.models.guest import Guest, GuestGroup
from app.schemas.guest_schema import GuestGroupSchema, GuestSchema
from app.services.workspace_service import require_event_permission
from app.utils.csv_parser import parse_guest_csv

guest_bp = Blueprint("guests", __name__)
guest_schema = GuestSchema()
guest_group_schema = GuestGroupSchema()


def _owned_event(event_id: str, permission: str = "guest.view") -> Event:
    event = db.session.get(Event, event_id)
    return require_event_permission(get_jwt_identity(), event, permission)


@guest_bp.get("/events/<event_id>/guests")
@jwt_required()
def list_guests(event_id: str):
    event = _owned_event(event_id)
    guests = db.session.scalars(
        db.select(Guest).where(Guest.event_id == event.id).order_by(Guest.name)
    ).all()
    return [guest.to_dict() for guest in guests]


@guest_bp.post("/events/<event_id>/guests")
@jwt_required()
def create_guest(event_id: str):
    event = _owned_event(event_id, "guest.create")
    payload = guest_schema.load(request.get_json(silent=True) or {})
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
        email=payload.get("email"),
        phone=payload.get("phone"),
        plus_ones=payload.get("plusOnes", 0),
    )
    db.session.add(guest)
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
    require_event_permission(get_jwt_identity(), group.event, "guest.update")
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
    require_event_permission(get_jwt_identity(), group.event, "guest.delete")
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
    guests = [
        Guest(
            event_id=event.id,
            name=row["name"],
            email=row.get("email"),
            phone=row.get("phone"),
            plus_ones=0,
        )
        for row in rows
    ]
    db.session.add_all(guests)
    db.session.commit()
    return {"imported": len(guests), "guests": [guest.to_dict() for guest in guests]}, 201


@guest_bp.patch("/guests/<guest_id>")
@jwt_required()
def update_guest(guest_id: str):
    guest = db.session.get(Guest, guest_id)
    if guest is None:
        raise ApiError("Guest not found.", 404)
    require_event_permission(get_jwt_identity(), guest.event, "guest.update")
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
        else:
            setattr(guest, key, value.strip() if isinstance(value, str) else value)
    db.session.commit()
    return guest.to_dict()


@guest_bp.delete("/guests/<guest_id>")
@jwt_required()
def delete_guest(guest_id: str):
    guest = db.session.get(Guest, guest_id)
    if guest is None:
        raise ApiError("Guest not found.", 404)
    require_event_permission(get_jwt_identity(), guest.event, "guest.delete")
    db.session.delete(guest)
    db.session.commit()
    return "", 204


@guest_bp.post("/guests/<guest_id>/invitation-token/rotate")
@jwt_required()
def rotate_guest_invitation_token(guest_id: str):
    guest = db.session.get(Guest, guest_id)
    if guest is None:
        raise ApiError("Guest not found.", 404)
    require_event_permission(get_jwt_identity(), guest.event, "guest.update")
    guest.invitation_token = token_urlsafe(24)
    guest.invitation_expires_at = datetime.now(timezone.utc) + timedelta(
        days=current_app.config["INVITATION_TOKEN_EXPIRY_DAYS"]
    )
    db.session.commit()
    return {
        "guestId": guest.id,
        "invitationToken": guest.invitation_token,
        "expiresAt": guest.invitation_expires_at.isoformat(),
    }
