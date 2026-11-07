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
    functionIds = fields.List(fields.String(), load_default=None)


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
    invited_function_ids = [mapping.function_id for mapping in guest.function_mappings]
    if not invited_function_ids:
        invited_function_ids = [function.id for function in guest.event.functions]
    invited_function_set = set(invited_function_ids)
    responses = {response.function_id: response for response in guest.rsvps}
    return {
        "guestName": guest.name,
        "event": {
            "name": guest.event.name,
            "date": guest.event.date.isoformat(),
            "location": guest.event.location,
        },
        "status": guest.rsvp_status,
        "functions": [
            {
                "id": function.id,
                "name": function.name,
                "date": function.date.isoformat(),
                "venue": function.venue,
                "status": responses[function.id].status if function.id in responses else "pending",
            }
            for function in sorted(guest.event.functions, key=lambda item: (item.date, item.name))
            if function.id in invited_function_set
        ],
    }


@rsvp_bp.post("")
def submit_rsvp():
    payload = rsvp_schema.load(request.get_json(silent=True) or {})
    guest = _guest_for_token(payload["invitationToken"])

    invited_function_ids = {mapping.function_id for mapping in guest.function_mappings}
    if not invited_function_ids:
        invited_function_ids = {function.id for function in guest.event.functions}
    selected_function_ids = payload.get("functionIds")
    if selected_function_ids is None:
        selected_function_ids = list(invited_function_ids)
    if len(selected_function_ids) != len(set(selected_function_ids)):
        raise ValidationError({"functionIds": ["A function can only be selected once."]})
    if any(function_id not in invited_function_ids for function_id in selected_function_ids):
        raise ValidationError({"functionIds": ["A selected function is not part of this invitation."]})
    if invited_function_ids and not selected_function_ids:
        raise ValidationError({"functionIds": ["Select at least one function to RSVP to."]})

    functions_by_id = {function.id: function for function in guest.event.functions}
    guest.rsvp_status = payload["status"]
    guest.plus_ones = payload.get("plusOnes", 0) if guest.rsvp_status == "attending" else 0
    for function_id in selected_function_ids:
        function = functions_by_id[function_id]
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
