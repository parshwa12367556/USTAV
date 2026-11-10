from datetime import datetime, timezone

from flask import Blueprint, current_app, request
from marshmallow import Schema, ValidationError, fields, validate

from app.core.exceptions import ApiError
from app.extensions import db, limiter
from app.models.guest import Guest
from app.models.rsvp import RSVP
from app.services.security_event_service import record_security_event
from app.utils.public_rate_limit import public_token_fingerprint_key
from app.utils.token_security import hash_bearer_token

rsvp_bp = Blueprint("rsvp", __name__)


class RSVPSubmitSchema(Schema):
    invitationToken = fields.String(required=True, validate=validate.Length(min=32, max=128))
    status = fields.String(required=True, validate=validate.OneOf(["attending", "declined", "maybe"]))
    plusOnes = fields.Integer(load_default=0, validate=validate.Range(min=0, max=20))
    dietaryNotes = fields.String(allow_none=True, validate=validate.Length(max=2000))
    functionIds = fields.List(
        fields.String(validate=validate.Length(min=1, max=36)),
        load_default=None,
        validate=validate.Length(max=100),
    )


class RSVPInvitationLookupSchema(Schema):
    token = fields.String(required=True, validate=validate.Length(min=32, max=128))


rsvp_schema = RSVPSubmitSchema()
invitation_lookup_schema = RSVPInvitationLookupSchema()


def _record_public_invitation_failure(reason: str) -> None:
    record_security_event(
        "guest.invitation_access_failed",
        "denied",
        resource_type="invitation",
        metadata={"reason": reason},
    )
    db.session.commit()


def _guest_for_token(token: str) -> Guest:
    guest = db.session.scalar(
        db.select(Guest).where(Guest.invitation_token_hash == hash_bearer_token(token))
    )
    if guest is None:
        _record_public_invitation_failure("invalid_or_unknown_token")
        raise ApiError("Invitation not found.", 404)
    if guest.invitation_revoked_at is not None:
        _record_public_invitation_failure("revoked_token")
        raise ApiError("This invitation is no longer available.", 410)
    expires_at = guest.invitation_expires_at
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)
    if expires_at <= datetime.now(timezone.utc):
        _record_public_invitation_failure("expired_token")
        raise ApiError("This invitation is no longer available.", 410)
    # Check event RSVP deadline
    if guest.event.rsvp_deadline_passed:
        _record_public_invitation_failure("rsvp_deadline_passed")
        raise ApiError("RSVP deadline has passed for this invitation.", 410)
    return guest


@rsvp_bp.after_request
def prevent_rsvp_caching(response):
    if request.path.startswith("/api/v1/rsvp"):
        response.headers["Cache-Control"] = "no-store"
        response.headers["Referrer-Policy"] = "no-referrer"
    return response


@rsvp_bp.post("/lookup")
@limiter.limit(lambda: current_app.config["PUBLIC_RSVP_LOOKUP_LIMIT"])
@limiter.limit(
    lambda: current_app.config["PUBLIC_RSVP_INVALID_LIMIT"],
    deduct_when=lambda response: response.status_code in {404, 410},
)
@limiter.limit(
    lambda: current_app.config["PUBLIC_INVALID_TOKEN_LIMIT"],
    key_func=public_token_fingerprint_key,
    deduct_when=lambda response: response.status_code in {404, 410},
)
def lookup_invitation():
    token = invitation_lookup_schema.load(request.get_json(silent=True) or {})["token"]
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
        "plusOnes": guest.plus_ones,
        "maxAttendees": guest.max_attendees,
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
@limiter.limit(lambda: current_app.config["PUBLIC_RSVP_SUBMIT_LIMIT"])
@limiter.limit(
    lambda: current_app.config["PUBLIC_RSVP_INVALID_LIMIT"],
    deduct_when=lambda response: response.status_code in {404, 410},
)
@limiter.limit(
    lambda: current_app.config["PUBLIC_INVALID_TOKEN_LIMIT"],
    key_func=public_token_fingerprint_key,
    deduct_when=lambda response: response.status_code in {404, 410},
)
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
    plus_ones = payload.get("plusOnes", 0) if payload["status"] == "attending" else 0
    if plus_ones + 1 > guest.max_attendees:
        raise ValidationError({"plusOnes": ["The attendee count exceeds this invitation's limit."]})

    functions_by_id = {function.id: function for function in guest.event.functions}
    previously_responded = guest.rsvp_status != "pending"
    guest.rsvp_status = payload["status"]
    guest.plus_ones = plus_ones
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
        if "dietaryNotes" in payload:
            response.dietary_notes = payload["dietaryNotes"]
    record_security_event(
        "guest.rsvp_updated" if previously_responded else "guest.rsvp_submitted",
        "succeeded",
        resource_type="guest",
        resource_id=guest.id,
        metadata={"event_id": guest.event_id, "function_count": len(selected_function_ids)},
    )
    db.session.commit()
    return {"message": "Your RSVP has been received."}, 200
