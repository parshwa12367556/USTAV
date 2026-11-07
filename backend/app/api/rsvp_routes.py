from datetime import datetime, timezone

from flask import Blueprint, request
from marshmallow import Schema, ValidationError, fields, validate

from app.core.exceptions import ApiError
from app.extensions import db
from app.models.guest import Guest
from app.models.rsvp import RSVP

rsvp_bp = Blueprint("rsvp", __name__)


class RSVPSubmitSchema(Schema):
    invitationToken = fields.String(required=True, validate=validate.Length(min=16, max=48))
    status = fields.String(required=True, validate=validate.OneOf(["attending", "declined", "maybe"]))
    plusOnes = fields.Integer(load_default=0, validate=validate.Range(min=0, max=20))
    dietaryNotes = fields.String(load_default=None, allow_none=True, validate=validate.Length(max=2000))
    functionIds = fields.List(fields.String(), load_default=list)


rsvp_schema = RSVPSubmitSchema()


def _guest_for_token(token: str) -> Guest:
    guest = db.session.scalar(db.select(Guest).where(Guest.invitation_token == token))
    if guest is None:
        raise ApiError("Invitation not found.", 404)
    expires_at = guest.invitation_expires_at
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)
    if expires_at <= datetime.now(timezone.utc):
        raise ApiError("This invitation has expired.", 410)
    return guest


@rsvp_bp.get("/<token>")
def get_invitation(token: str):
    guest = _guest_for_token(token)
    return {
        "guestName": guest.name,
        "event": {
            "name": guest.event.name,
            "date": guest.event.date.isoformat(),
            "location": guest.event.location,
        },
        "status": guest.rsvp_status,
    }


@rsvp_bp.post("")
def submit_rsvp():
    payload = rsvp_schema.load(request.get_json(silent=True) or {})
    guest = _guest_for_token(payload["invitationToken"])

    guest.rsvp_status = payload["status"]
    guest.plus_ones = payload.get("plusOnes", 0) if guest.rsvp_status == "attending" else 0
    for function_id in payload.get("functionIds", []):
        function = next((item for item in guest.event.functions if item.id == function_id), None)
        if function is None:
            raise ValidationError({"functionIds": ["A selected function does not belong to this invitation."]})
        response = db.session.scalar(
            db.select(RSVP).where(RSVP.guest_id == guest.id, RSVP.function_id == function.id)
        )
        if response is None:
            response = RSVP(guest_id=guest.id, function_id=function.id)
            db.session.add(response)
        response.status = guest.rsvp_status
        response.plus_ones = guest.plus_ones
        response.dietary_notes = payload.get("dietaryNotes")
    db.session.commit()
    return {"message": "Your RSVP has been received."}, 200
