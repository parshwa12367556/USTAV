from flask import Blueprint, request
from flask_jwt_extended import get_jwt, get_jwt_identity, jwt_required

from app.core.exceptions import ApiError
from app.extensions import db
from app.models.booking import Booking, BookingStatusHistory
from app.models.event import Event
from app.models.vendor import VendorProfile
from app.models.vendor_staff import VendorBookingAssignment, VendorMembership, VendorMembershipPermission
from app.schemas.booking_schema import BookingRequestSchema, BookingStatusSchema
from app.services.booking_service import transition_booking
from app.services.workspace_service import (
    accessible_event_ids,
    require_event_permission,
    user_has_event_permission,
)

booking_bp = Blueprint("bookings", __name__)
booking_schema = BookingRequestSchema()
booking_status_schema = BookingStatusSchema()


@booking_bp.get("")
@jwt_required()
def list_bookings():
    user_id = get_jwt_identity()
    profile = db.session.scalar(db.select(VendorProfile).where(VendorProfile.user_id == user_id))
    result: dict[str, Booking] = {}
    if profile:
        vendor_bookings = db.session.scalars(
            db.select(Booking)
            .where(Booking.vendor_id == profile.id)
            .order_by(Booking.created_at.desc())
        ).all()
        result.update((booking.id, booking) for booking in vendor_bookings)

    assigned_bookings = db.session.scalars(
        db.select(Booking)
        .join(VendorBookingAssignment, VendorBookingAssignment.booking_id == Booking.id)
        .join(VendorMembership, VendorMembership.id == VendorBookingAssignment.membership_id)
        .join(
            VendorMembershipPermission,
            VendorMembershipPermission.membership_id == VendorMembership.id,
        )
        .where(
            VendorMembership.user_id == user_id,
            VendorMembership.status == "active",
            VendorMembershipPermission.permission == "booking.view",
        )
    ).all()
    result.update((booking.id, booking) for booking in assigned_bookings)

    family_bookings = db.session.scalars(
        db.select(Booking)
        .where(Booking.event_id.in_(accessible_event_ids(user_id, "booking.view")))
        .order_by(Booking.created_at.desc())
    ).all()
    result.update((booking.id, booking) for booking in family_bookings)
    event_id = request.args.get("eventId")
    if event_id:
        result = {key: booking for key, booking in result.items() if booking.event_id == event_id}
    bookings = sorted(result.values(), key=lambda booking: booking.created_at, reverse=True)
    return [booking.to_dict() for booking in bookings]


@booking_bp.post("")
@jwt_required()
def create_booking():
    payload = booking_schema.load(request.get_json(silent=True) or {})
    event = db.session.get(Event, payload["eventId"])
    vendor = db.session.get(VendorProfile, payload["vendorId"])
    require_event_permission(get_jwt_identity(), event, "booking.create")
    if vendor is None or vendor.verification_status != "verified":
        raise ApiError("Verified vendor not found.", 404)

    booking = Booking(
        event_id=event.id,
        vendor_id=vendor.id,
        service_name=payload["serviceName"].strip(),
        event_date=payload["eventDate"],
        amount=payload["amount"],
        status="requested",
    )
    booking.history.append(BookingStatusHistory(status="requested", note="Booking request created."))
    db.session.add(booking)
    db.session.commit()
    return booking.to_dict(), 201


@booking_bp.patch("/<booking_id>")
@jwt_required()
def update_booking(booking_id: str):
    booking = db.session.get(Booking, booking_id)
    if booking is None:
        raise ApiError("Booking not found.", 404)
    role = get_jwt().get("role")
    user_id = get_jwt_identity()
    event = db.session.get(Event, booking.event_id)
    owns_event = user_has_event_permission(user_id, event, "booking.update")
    vendor_id = db.session.scalar(
        db.select(VendorProfile.id).where(VendorProfile.user_id == user_id)
    )
    owns_vendor = booking.vendor_id == vendor_id
    staff_membership = db.session.scalar(
        db.select(VendorMembership)
        .join(
            VendorBookingAssignment,
            VendorBookingAssignment.membership_id == VendorMembership.id,
        )
        .join(
            VendorMembershipPermission,
            VendorMembershipPermission.membership_id == VendorMembership.id,
        )
        .where(
            VendorMembership.user_id == user_id,
            VendorMembership.status == "active",
            VendorMembershipPermission.permission == "booking.update",
            VendorBookingAssignment.booking_id == booking.id,
        )
    )
    if not owns_event and not owns_vendor and staff_membership is None and role != "admin":
        raise ApiError("Booking not found.", 404)

    payload = booking_status_schema.load(request.get_json(silent=True) or {})
    next_status = payload["status"]
    if role != "admin" and owns_event and next_status != "cancelled":
        raise ApiError("Family workspace members can only cancel bookings.", 403)
    if role != "admin" and staff_membership is not None:
        if booking.status != "confirmed" or next_status != "completed":
            raise ApiError("Staff can only mark assigned confirmed bookings complete.", 403)
    if role != "admin" and not owns_event and owns_vendor and staff_membership is None:
        vendor_transitions = {
            "requested": {"confirmed", "cancelled"},
            "confirmed": {"completed", "cancelled"},
        }
        if next_status not in vendor_transitions.get(booking.status, set()):
            raise ApiError("Vendors cannot make this booking status change.", 403)
    transition_booking(booking, payload["status"], payload.get("note"))
    return booking.to_dict()
