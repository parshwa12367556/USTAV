from flask import Blueprint, request
from flask_jwt_extended import get_jwt, get_jwt_identity, jwt_required

from app.core.exceptions import ApiError
from app.extensions import db
from app.models.booking import Booking
from app.models.event import Event
from app.models.payment import Payment
from app.services.payment_service import (
    create_checkout_session,
    process_razorpay_webhook,
    verify_checkout_payment,
)
from app.services.workspace_service import accessible_event_ids, require_event_permission

payment_bp = Blueprint("payments", __name__)


@payment_bp.get("")
@jwt_required()
def list_payments():
    payments = db.session.scalars(
        db.select(Payment)
        .where(
            Payment.booking_id.in_(
                db.select(Booking.id).where(
                    Booking.event_id.in_(
                        accessible_event_ids(
                            get_jwt_identity(),
                            "payment.view",
                            get_jwt().get("membership_id"),
                        )
                    )
                )
            )
        )
        .order_by(Payment.created_at.desc())
    ).all()
    return [item.to_dict() for item in payments]


@payment_bp.post("/checkout")
@jwt_required()
def checkout():
    body = request.get_json(silent=True)
    if not isinstance(body, dict):
        raise ApiError("Request body must be a JSON object.")
    booking_id = body.get("bookingId")
    if not isinstance(booking_id, str) or not booking_id:
        raise ApiError("bookingId is required.")
    booking = db.session.get(Booking, booking_id)
    event = db.session.get(Event, booking.event_id) if booking else None
    if booking is None:
        raise ApiError("Booking not found.", 404)
    require_event_permission(
        get_jwt_identity(), event, "payment.manage", get_jwt().get("membership_id")
    )
    return create_checkout_session(booking)


@payment_bp.post("/verify")
@jwt_required()
def verify_checkout():
    body = request.get_json(silent=True)
    if not isinstance(body, dict):
        raise ApiError("Request body must be a JSON object.")
    return verify_checkout_payment(
        get_jwt_identity(),
        body.get("razorpay_order_id"),
        body.get("razorpay_payment_id"),
        body.get("razorpay_signature"),
        get_jwt().get("membership_id"),
    )


@payment_bp.post("/webhooks/<provider>")
def payment_webhook(provider: str):
    if provider != "razorpay":
        raise ApiError(f"The {provider} payment webhook is not supported.", 404)
    processed = process_razorpay_webhook(
        request.get_data(cache=False),
        request.headers.get("X-Razorpay-Signature"),
    )
    return {"received": True, "processed": processed}
