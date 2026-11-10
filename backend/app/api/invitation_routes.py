from datetime import datetime, timezone

from flask import Blueprint, current_app, request
from flask_jwt_extended import get_jwt, get_jwt_identity, jwt_required
from marshmallow import Schema, ValidationError, fields, validate

from app.core.exceptions import ApiError
from app.extensions import db, limiter
from app.models.event import Event
from app.models.invitation import InvitationTemplate, UserInvitation
from app.schemas.invitation_schema import InvitationSchema, InvitationUpdateSchema
from app.services.invitation_service import publish_invitation
from app.services.security_event_service import record_security_event
from app.services.workspace_service import accessible_event_ids, require_event_permission
from app.utils.public_rate_limit import public_token_fingerprint_key
from app.utils.token_security import hash_bearer_token

invitation_bp = Blueprint("invitations", __name__)
invitation_schema = InvitationSchema()
invitation_update_schema = InvitationUpdateSchema()


class PublicInvitationLookupSchema(Schema):
    token = fields.String(required=True, validate=validate.Length(min=32, max=128))


public_invitation_lookup_schema = PublicInvitationLookupSchema()


def _owned_invitation(invitation_id: str, permission: str = "invitation.view") -> UserInvitation:
    invitation = db.session.get(UserInvitation, invitation_id)
    event = db.session.get(Event, invitation.event_id) if invitation else None
    if invitation is None:
        raise ApiError("Invitation not found.", 404)
    require_event_permission(
        get_jwt_identity(), event, permission, get_jwt().get("membership_id")
    )
    return invitation


def _serialize(invitation: UserInvitation) -> dict[str, object]:
    return {
        "id": invitation.id,
        "eventId": invitation.event_id,
        "templateId": invitation.template_id,
        "title": invitation.title,
        "status": invitation.status,
        "design": invitation.design,
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
                accessible_event_ids(
                    get_jwt_identity(),
                    "invitation.view",
                    get_jwt().get("membership_id"),
                )
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
    require_event_permission(
        get_jwt_identity(),
        event,
        "invitation.create",
        get_jwt().get("membership_id"),
    )
    template = db.session.get(InvitationTemplate, payload["templateId"])
    if template is None or not template.is_published:
        raise ApiError("Invitation template not found.", 404)

    invitation = UserInvitation(
        event_id=event.id,
        template_id=template.id,
        title=payload["title"].strip(),
        design=payload["design"],
    )
    share_token = publish_invitation(invitation) if payload["status"] == "published" else None
    db.session.add(invitation)
    db.session.flush()
    if share_token:
        record_security_event(
            "invitation.generated",
            "succeeded",
            user_id=get_jwt_identity(),
            resource_type="invitation",
            resource_id=invitation.id,
            metadata={"event_id": event.id},
        )
    db.session.commit()
    result = _serialize(invitation)
    if share_token:
        result["shareToken"] = share_token
    return result, 201


@invitation_bp.patch("/<invitation_id>")
@jwt_required()
def update_invitation(invitation_id: str):
    invitation = _owned_invitation(invitation_id, "invitation.update")
    payload = invitation_update_schema.load(request.get_json(silent=True) or {})
    if not payload:
        raise ValidationError({"_schema": ["At least one field is required."]})
    share_token = None
    for key, value in payload.items():
        if key == "status" and value == "published":
            share_token = publish_invitation(invitation)
        elif key == "status":
            invitation.status = value
            invitation.share_token_hash = None
            invitation.share_expires_at = datetime.now(timezone.utc)
        else:
            setattr(invitation, key, value.strip() if isinstance(value, str) else value)
    if share_token:
        record_security_event(
            "invitation.generated",
            "succeeded",
            user_id=get_jwt_identity(),
            resource_type="invitation",
            resource_id=invitation.id,
            metadata={"event_id": invitation.event_id},
        )
    db.session.commit()
    result = _serialize(invitation)
    if share_token:
        result["shareToken"] = share_token
    return result


@invitation_bp.post("/<invitation_id>/share-token")
@jwt_required()
def rotate_public_invitation_token(invitation_id: str):
    invitation = _owned_invitation(invitation_id, "invitation.update")
    if invitation.status != "published":
        raise ApiError("Publish this invitation before generating a share link.", 409)
    token = publish_invitation(invitation)
    record_security_event(
        "invitation.token_rotated",
        "succeeded",
        user_id=get_jwt_identity(),
        resource_type="invitation",
        resource_id=invitation.id,
        metadata={"event_id": invitation.event_id},
    )
    db.session.commit()
    return {
        "invitationId": invitation.id,
        "shareToken": token,
        "expiresAt": invitation.share_expires_at.isoformat(),
    }


@invitation_bp.post("/<invitation_id>/revoke")
@jwt_required()
def revoke_public_invitation(invitation_id: str):
    invitation = _owned_invitation(invitation_id, "invitation.update")
    invitation.status = "draft"
    invitation.share_token_hash = None
    invitation.share_expires_at = datetime.now(timezone.utc)
    record_security_event(
        "invitation.revoked",
        "succeeded",
        user_id=get_jwt_identity(),
        resource_type="invitation",
        resource_id=invitation.id,
        metadata={"event_id": invitation.event_id},
    )
    db.session.commit()
    return _serialize(invitation)


@invitation_bp.after_request
def prevent_public_invitation_caching(response):
    if request.path == "/api/v1/invitations/public/lookup":
        response.headers["Cache-Control"] = "no-store"
        response.headers["Referrer-Policy"] = "no-referrer"
    return response


@invitation_bp.post("/public/lookup")
@limiter.limit(lambda: current_app.config["PUBLIC_INVITATION_LOOKUP_LIMIT"])
@limiter.limit(
    lambda: current_app.config["PUBLIC_INVITATION_INVALID_LIMIT"],
    deduct_when=lambda response: response.status_code in {404, 410},
)
@limiter.limit(
    lambda: current_app.config["PUBLIC_INVALID_TOKEN_LIMIT"],
    key_func=public_token_fingerprint_key,
    deduct_when=lambda response: response.status_code in {404, 410},
)
def lookup_public_invitation():
    token = public_invitation_lookup_schema.load(request.get_json(silent=True) or {})["token"]
    invitation = db.session.scalar(
        db.select(UserInvitation).where(
            UserInvitation.share_token_hash == hash_bearer_token(token),
            UserInvitation.status == "published",
        )
    )
    if invitation is None:
        record_security_event(
            "invitation.public_access_failed",
            "denied",
            resource_type="invitation",
            metadata={"reason": "invalid_or_unpublished_token"},
        )
        db.session.commit()
        raise ApiError("Invitation not found.", 404)
    if invitation.share_expires_at is None:
        record_security_event(
            "invitation.public_access_failed",
            "denied",
            resource_type="invitation",
            resource_id=invitation.id,
            metadata={"reason": "missing_expiry"},
        )
        db.session.commit()
        raise ApiError("Invitation not found.", 404)
    expires_at = invitation.share_expires_at
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)
    if expires_at <= datetime.now(timezone.utc):
        record_security_event(
            "invitation.public_access_failed",
            "denied",
            resource_type="invitation",
            resource_id=invitation.id,
            metadata={"reason": "expired_token"},
        )
        db.session.commit()
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
            "functions": [
                {
                    "name": item.name,
                    "date": item.date.isoformat(),
                    "venue": item.venue,
                }
                for item in sorted(event.functions, key=lambda value: (value.date, value.name))
            ],
        },
    }
