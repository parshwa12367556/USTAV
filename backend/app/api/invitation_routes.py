from datetime import datetime, timezone

from flask import Blueprint, request
from flask_jwt_extended import get_jwt_identity, jwt_required
from marshmallow import ValidationError

from app.core.exceptions import ApiError
from app.extensions import db
from app.models.event import Event
from app.models.invitation import InvitationTemplate, UserInvitation
from app.schemas.invitation_schema import InvitationSchema, InvitationUpdateSchema
from app.services.invitation_service import publish_invitation
from app.services.workspace_service import accessible_event_ids, require_event_permission

invitation_bp = Blueprint("invitations", __name__)
invitation_schema = InvitationSchema()
invitation_update_schema = InvitationUpdateSchema()


def _owned_invitation(invitation_id: str, permission: str = "invitation.view") -> UserInvitation:
    invitation = db.session.get(UserInvitation, invitation_id)
    event = db.session.get(Event, invitation.event_id) if invitation else None
    if invitation is None:
        raise ApiError("Invitation not found.", 404)
    require_event_permission(get_jwt_identity(), event, permission)
    return invitation


def _serialize(invitation: UserInvitation) -> dict[str, object]:
    return {
        "id": invitation.id,
        "eventId": invitation.event_id,
        "templateId": invitation.template_id,
        "title": invitation.title,
        "status": invitation.status,
        "design": invitation.design,
        "shareToken": invitation.share_token,
        "shareExpiresAt": invitation.share_expires_at.isoformat() if invitation.share_expires_at else None,
    }


@invitation_bp.get("/templates")
def list_templates():
    templates = db.session.scalars(
        db.select(InvitationTemplate)
        .where(InvitationTemplate.is_published.is_(True))
        .order_by(InvitationTemplate.name)
    ).all()
    return [
        {
            "id": item.id,
            "name": item.name,
            "category": item.category,
            "previewUrl": item.preview_url,
            "price": float(item.price),
        }
        for item in templates
    ]


@invitation_bp.get("")
@jwt_required()
def list_invitations():
    invitations = db.session.scalars(
        db.select(UserInvitation)
        .join(Event)
        .where(
            UserInvitation.event_id.in_(
                accessible_event_ids(get_jwt_identity(), "invitation.view")
            )
        )
        .order_by(UserInvitation.created_at.desc())
    ).all()
    return [_serialize(item) for item in invitations]


@invitation_bp.post("")
@jwt_required()
def create_invitation():
    payload = invitation_schema.load(request.get_json(silent=True) or {})
    event = db.session.get(Event, payload["eventId"])
    require_event_permission(get_jwt_identity(), event, "invitation.create")
    template = db.session.get(InvitationTemplate, payload["templateId"])
    if template is None or not template.is_published:
        raise ApiError("Invitation template not found.", 404)

    invitation = UserInvitation(
        event_id=event.id,
        template_id=template.id,
        title=payload["title"].strip(),
        design=payload["design"],
    )
    if payload["status"] == "published":
        publish_invitation(invitation)
    db.session.add(invitation)
    db.session.commit()
    return _serialize(invitation), 201


@invitation_bp.patch("/<invitation_id>")
@jwt_required()
def update_invitation(invitation_id: str):
    invitation = _owned_invitation(invitation_id, "invitation.update")
    payload = invitation_update_schema.load(request.get_json(silent=True) or {})
    if not payload:
        raise ValidationError({"_schema": ["At least one field is required."]})
    for key, value in payload.items():
        if key == "status" and value == "published":
            publish_invitation(invitation)
        elif key == "status":
            invitation.status = value
        else:
            setattr(invitation, key, value.strip() if isinstance(value, str) else value)
    db.session.commit()
    return _serialize(invitation)


@invitation_bp.get("/public/<share_token>")
def get_public_invitation(share_token: str):
    invitation = db.session.scalar(
        db.select(UserInvitation).where(
            UserInvitation.share_token == share_token,
            UserInvitation.status == "published",
        )
    )
    if invitation is None:
        raise ApiError("Invitation not found.", 404)
    if invitation.share_expires_at is None:
        raise ApiError("Invitation not found.", 404)
    expires_at = invitation.share_expires_at
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)
    if expires_at <= datetime.now(timezone.utc):
        raise ApiError("This invitation has expired.", 410)
    event = db.session.get(Event, invitation.event_id)
    return {
        "title": invitation.title,
        "design": invitation.design,
        "event": {
            "name": event.name,
            "type": event.event_type,
            "date": event.date.isoformat(),
            "venue": event.venue,
            "location": event.location,
        },
    }
