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
    membership_id = get_jwt().get("membership_id")
    active_vendor_membership = (
        db.session.get(VendorMembership, membership_id) if membership_id else None
    )
    if membership_id is None:
        profile = db.session.scalar(
            db.select(VendorProfile).where(VendorProfile.user_id == user_id)
        )
    elif (
        active_vendor_membership is not None
        and active_vendor_membership.user_id == user_id
        and active_vendor_membership.status == "active"
        and active_vendor_membership.role == "owner"
    ):
        profile = db.session.get(VendorProfile, active_vendor_membership.vendor_id)
    else:
        profile = None
    result: dict[str, Booking] = {}
    if profile:
        vendor_bookings = db.session.scalars(
            db.select(Booking)
            .where(Booking.vendor_id == profile.id)
            .order_by(Booking.created_at.desc())
        ).all()
        result.update((booking.id, booking) for booking in vendor_bookings)

    assigned_query = (
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
    )
    if membership_id:
        if (
            active_vendor_membership is None
            or active_vendor_membership.user_id != user_id
            or active_vendor_membership.status != "active"
        ):
            assigned_query = assigned_query.where(db.false())
        else:
            assigned_query = assigned_query.where(
                VendorMembership.id == active_vendor_membership.id
            )
    assigned_bookings = db.session.scalars(assigned_query).all()
    result.update((booking.id, booking) for booking in assigned_bookings)

    family_bookings = db.session.scalars(
        db.select(Booking)
        .where(
            Booking.event_id.in_(
                accessible_event_ids(user_id, "booking.view", membership_id)
            )
        )
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
    require_event_permission(
        get_jwt_identity(), event, "booking.create", get_jwt().get("membership_id")
    )
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
    owns_event = user_has_event_permission(
        user_id, event, "booking.update", get_jwt().get("membership_id")
    )
    membership_id = get_jwt().get("membership_id")
    active_vendor_membership = (
        db.session.get(VendorMembership, membership_id) if membership_id else None
    )
    if membership_id is None:
        vendor_id = db.session.scalar(
            db.select(VendorProfile.id).where(VendorProfile.user_id == user_id)
        )
    elif (
        active_vendor_membership is not None
        and active_vendor_membership.user_id == user_id
        and active_vendor_membership.status == "active"
        and active_vendor_membership.role == "owner"
    ):
        vendor_id = active_vendor_membership.vendor_id
    else:
        vendor_id = None
    owns_vendor = booking.vendor_id == vendor_id
    staff_query = (
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
    if membership_id:
        if (
            active_vendor_membership is None
            or active_vendor_membership.user_id != user_id
            or active_vendor_membership.status != "active"
            or active_vendor_membership.role == "owner"
        ):
            staff_query = staff_query.where(db.false())
        else:
            staff_query = staff_query.where(
                VendorMembership.id == active_vendor_membership.id
            )
    staff_membership = db.session.scalar(staff_query)
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
