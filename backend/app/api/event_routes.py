from flask import Blueprint, request
from flask_jwt_extended import get_jwt, get_jwt_identity, jwt_required
from marshmallow import ValidationError
from sqlalchemy import and_, or_

from app.core.exceptions import ApiError
from app.extensions import db
from app.models.event import Event, Function
from app.models.user import User
from app.models.workspace import FamilyMembership, FamilyMembershipPermission, FamilyWorkspace
from app.schemas.event_schema import EventSchema, FunctionSchema
from app.services.workspace_service import ensure_family_workspace, require_event_permission

event_bp = Blueprint("events", __name__)
event_schema = EventSchema()
function_schema = FunctionSchema()


def _owned_event(event_id: str, permission: str = "event.view") -> Event:
    event = db.session.get(Event, event_id)
    return require_event_permission(get_jwt_identity(), event, permission)


@event_bp.get("/events")
@jwt_required()
def list_events():
    events = db.session.scalars(
        db.select(Event)
        .outerjoin(FamilyWorkspace, FamilyWorkspace.owner_user_id == Event.owner_id)
        .outerjoin(
            FamilyMembership,
            FamilyMembership.workspace_id == FamilyWorkspace.id,
        )
        .outerjoin(
            FamilyMembershipPermission,
            FamilyMembershipPermission.membership_id == FamilyMembership.id,
        )
        .where(
            or_(
                Event.owner_id == get_jwt_identity(),
                and_(
                    FamilyMembership.user_id == get_jwt_identity(),
                    FamilyMembership.status == "active",
                    FamilyMembershipPermission.permission == "event.view",
                ),
            )
        )
        .distinct()
        .order_by(Event.date, Event.created_at)
    ).all()
    return [event.to_dict() for event in events]


@event_bp.post("/events")
@jwt_required()
def create_event():
    payload = event_schema.load(request.get_json(silent=True) or {})
    owner = db.session.get(User, get_jwt_identity())
    if owner is None:
        raise ApiError("Family owner account is unavailable.", 403)
    membership_id = get_jwt().get("membership_id")
    membership = db.session.get(FamilyMembership, membership_id) if membership_id else None
    if membership is not None and membership.status == "active" and membership.role != "owner":
        if db.session.scalar(
            db.select(FamilyMembershipPermission.id).where(
                FamilyMembershipPermission.membership_id == membership.id,
                FamilyMembershipPermission.permission == "event.create",
            )
        ) is None:
            raise ApiError("You do not have permission to create events in this workspace.", 403)
        workspace = db.session.get(FamilyWorkspace, membership.workspace_id)
        if workspace is None:
            raise ApiError("Family workspace is unavailable.", 404)
        event_owner_id = workspace.owner_user_id
    else:
        workspace = db.session.scalar(
            db.select(FamilyWorkspace).where(FamilyWorkspace.owner_user_id == owner.id)
        )
        if workspace is None and owner.role == "family":
            workspace = ensure_family_workspace(owner)
        if workspace is None or (
            membership is not None
            and membership.role == "owner"
            and membership.workspace_id != workspace.id
        ):
            raise ApiError("A family workspace membership is required to create events.", 403)
        event_owner_id = workspace.owner_user_id
    if payload.get("endDate") and payload["endDate"] < payload["date"]:
        raise ValidationError({"endDate": ["End date cannot be before start date."]})
    event = Event(
        owner_id=event_owner_id,
        name=payload["name"].strip(),
        event_type=payload["type"].strip(),
        date=payload["date"],
        end_date=payload.get("endDate"),
        venue=payload.get("venue"),
        location=payload.get("location"),
        guest_count=payload.get("guestCount", 0),
        budget=payload.get("budget"),
        status=payload.get("status", "planning"),
        description=payload.get("description"),
    )
    db.session.add(event)
    db.session.commit()
    return event.to_dict(), 201


@event_bp.get("/events/<event_id>")
@jwt_required()
def get_event(event_id: str):
    return _owned_event(event_id).to_dict()


@event_bp.patch("/events/<event_id>")
@jwt_required()
def update_event(event_id: str):
    event = _owned_event(event_id, "event.update")
    payload = event_schema.load(request.get_json(silent=True) or {}, partial=True)
    mapping = {
        "name": "name",
        "type": "event_type",
        "date": "date",
        "endDate": "end_date",
        "venue": "venue",
        "location": "location",
        "guestCount": "guest_count",
        "budget": "budget",
        "status": "status",
        "description": "description",
    }
    for key, value in payload.items():
        setattr(event, mapping[key], value.strip() if isinstance(value, str) and key in {"name", "type"} else value)
    if event.end_date and event.end_date < event.date:
        raise ValidationError({"endDate": ["End date cannot be before start date."]})
    db.session.commit()
    return event.to_dict()


@event_bp.delete("/events/<event_id>")
@jwt_required()
def delete_event(event_id: str):
    event = _owned_event(event_id, "event.delete")
    db.session.delete(event)
    db.session.commit()
    return "", 204


@event_bp.get("/events/<event_id>/functions")
@jwt_required()
def list_functions(event_id: str):
    event = _owned_event(event_id)
    return [item.to_dict() for item in event.functions]


@event_bp.post("/events/<event_id>/functions")
@jwt_required()
def create_function(event_id: str):
    event = _owned_event(event_id, "function.manage")
    payload = function_schema.load(request.get_json(silent=True) or {})
    function = Function(
        event_id=event.id,
        name=payload["name"].strip(),
        date=payload["date"],
        venue=payload.get("venue"),
        guest_count=payload.get("guestCount", 0),
        notes=payload.get("notes"),
    )
    db.session.add(function)
    db.session.commit()
    return function.to_dict(), 201


@event_bp.patch("/functions/<function_id>")
@jwt_required()
def update_function(function_id: str):
    function = db.session.get(Function, function_id)
    if function is None:
        raise ApiError("Event function not found.", 404)
    require_event_permission(get_jwt_identity(), function.event, "function.manage")
    payload = function_schema.load(request.get_json(silent=True) or {}, partial=True)
    if not payload:
        raise ValidationError({"_schema": ["At least one field is required."]})
    for key, value in payload.items():
        attribute = {
            "name": "name",
            "date": "date",
            "venue": "venue",
            "guestCount": "guest_count",
            "notes": "notes",
        }[key]
        setattr(function, attribute, value.strip() if isinstance(value, str) and key == "name" else value)
    db.session.commit()
    return function.to_dict()


@event_bp.delete("/functions/<function_id>")
@jwt_required()
def delete_function(function_id: str):
    function = db.session.get(Function, function_id)
    if function is None:
        raise ApiError("Event function not found.", 404)
    require_event_permission(get_jwt_identity(), function.event, "function.manage")
    db.session.delete(function)
    db.session.commit()
    return "", 204
