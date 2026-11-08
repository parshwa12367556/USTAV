from datetime import datetime, timedelta, timezone
from hashlib import sha256
import secrets

from flask import Blueprint, request
from flask_jwt_extended import get_jwt_identity, jwt_required

from app.core.exceptions import ApiError
from app.core.security import hash_password
from app.extensions import db
from app.models.booking import Booking
from app.models.user import User
from app.models.vendor import VendorProfile
from app.models.vendor_staff import (
    VendorBookingAssignment,
    VendorMembership,
    VendorMembershipPermission,
    VendorStaffInvitation,
)
from app.schemas.vendor_staff_schema import (
    VendorStaffAcceptInvitationSchema,
    VendorStaffAssignmentSchema,
    VendorStaffInvitationSchema,
)


vendor_staff_bp = Blueprint("vendor_staff", __name__)
invitation_schema = VendorStaffInvitationSchema()
accept_invitation_schema = VendorStaffAcceptInvitationSchema()
assignment_schema = VendorStaffAssignmentSchema()


def _owner_vendor() -> VendorProfile:
    user = db.session.get(User, get_jwt_identity())
    if user is None or user.role != "vendor" or user.vendor_profile is None:
        raise ApiError("A vendor owner account is required.", 403)
    return user.vendor_profile


def _staff_dict(membership: VendorMembership) -> dict[str, object]:
    user = db.session.get(User, membership.user_id)
    return {
        "id": membership.id,
        "userId": membership.user_id,
        "name": user.name if user else "",
        "email": user.email if user else "",
        "role": membership.role,
        "status": membership.status,
    }


@vendor_staff_bp.get("/profile/me/staff")
@jwt_required()
def list_vendor_staff():
    vendor = _owner_vendor()
    members = db.session.scalars(
        db.select(VendorMembership)
        .where(VendorMembership.vendor_id == vendor.id)
        .order_by(VendorMembership.created_at)
    ).all()
    return [_staff_dict(member) for member in members]


@vendor_staff_bp.post("/profile/me/staff/invitations")
@jwt_required()
def invite_vendor_staff():
    vendor = _owner_vendor()
    payload = invitation_schema.load(request.get_json(silent=True) or {})
    email = payload["email"].strip().lower()
    if email == vendor.user.email.lower():
        raise ApiError("The vendor owner cannot be invited as staff.", 409)
    user = db.session.scalar(db.select(User).where(User.email == email))
    if user and db.session.scalar(
        db.select(VendorMembership.id).where(
            VendorMembership.vendor_id == vendor.id,
            VendorMembership.user_id == user.id,
        )
    ):
        raise ApiError("This user already belongs to the vendor team.", 409)

    pending = db.session.scalars(
        db.select(VendorStaffInvitation).where(
            VendorStaffInvitation.vendor_id == vendor.id,
            VendorStaffInvitation.email == email,
            VendorStaffInvitation.status == "pending",
        )
    ).all()
    for existing in pending:
        existing.status = "revoked"
    raw_token = secrets.token_urlsafe(32)
    invitation = VendorStaffInvitation(
        vendor_id=vendor.id,
        email=email,
        token_hash=sha256(raw_token.encode("utf-8")).hexdigest(),
        status="pending",
        expires_at=datetime.now(timezone.utc) + timedelta(days=7),
        invited_by_user_id=get_jwt_identity(),
    )
    db.session.add(invitation)
    db.session.commit()
    return {
        "id": invitation.id,
        "email": invitation.email,
        "expiresAt": invitation.expires_at.isoformat(),
        "acceptanceToken": raw_token,
    }, 201


@vendor_staff_bp.post("/staff/invitations/accept")
@jwt_required(optional=True)
def accept_vendor_staff_invitation():
    payload = accept_invitation_schema.load(request.get_json(silent=True) or {})
    token_hash = sha256(payload["token"].encode("utf-8")).hexdigest()
    invitation = db.session.scalar(
        db.select(VendorStaffInvitation).where(
            VendorStaffInvitation.token_hash == token_hash,
            VendorStaffInvitation.status == "pending",
        )
    )
    user_id = get_jwt_identity()
    user = db.session.get(User, user_id) if user_id else None
    if invitation is None:
        raise ApiError("Vendor staff invitation is invalid or unavailable.", 404)
    expires_at = invitation.expires_at
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)
    if expires_at <= datetime.now(timezone.utc):
        invitation.status = "expired"
        db.session.commit()
        raise ApiError("Vendor staff invitation has expired.", 410)
    if user is None:
        if not payload.get("name") or not payload.get("password"):
            raise ApiError("Name and password are required to create an invited account.", 400)
        if db.session.scalar(db.select(User.id).where(User.email == invitation.email)):
            raise ApiError("Sign in to accept this invitation for your existing account.", 401)
        user = User(
            name=payload["name"].strip(),
            email=invitation.email,
            password_hash=hash_password(payload["password"]),
            role="vendor",
            is_active=True,
            is_verified=True,
        )
        db.session.add(user)
        db.session.flush()
    if not user.is_verified or user.email.lower() != invitation.email:
        raise ApiError("Vendor staff invitation is invalid or unavailable.", 404)
    if db.session.scalar(
        db.select(VendorMembership.id).where(
            VendorMembership.vendor_id == invitation.vendor_id,
            VendorMembership.user_id == user.id,
        )
    ):
        raise ApiError("This account already belongs to the vendor team.", 409)

    membership = VendorMembership(
        vendor_id=invitation.vendor_id,
        user_id=user.id,
        role="staff",
        status="active",
    )
    db.session.add(membership)
    db.session.flush()
    db.session.add_all(
        [
            VendorMembershipPermission(membership_id=membership.id, permission="booking.view"),
            VendorMembershipPermission(membership_id=membership.id, permission="booking.update"),
        ]
    )
    invitation.status = "accepted"
    db.session.commit()
    from app.services.auth_service import create_session

    return {
        "membership": _staff_dict(membership),
        "session": create_session(user, membership.id, strict_membership=True),
    }


@vendor_staff_bp.delete("/profile/me/staff/<membership_id>")
@jwt_required()
def remove_vendor_staff(membership_id: str):
    vendor = _owner_vendor()
    membership = db.session.get(VendorMembership, membership_id)
    if membership is None or membership.vendor_id != vendor.id:
        raise ApiError("Vendor staff member not found.", 404)
    db.session.delete(membership)
    db.session.commit()
    return "", 204


@vendor_staff_bp.get("/staff/me/bookings")
@jwt_required()
def list_assigned_vendor_bookings():
    membership_ids = db.session.scalars(
        db.select(VendorMembership.id).where(
            VendorMembership.user_id == get_jwt_identity(),
            VendorMembership.status == "active",
        )
    ).all()
    if not membership_ids:
        return []
    bookings = db.session.scalars(
        db.select(Booking)
        .join(VendorBookingAssignment, VendorBookingAssignment.booking_id == Booking.id)
        .join(
            VendorMembership,
            VendorMembership.id == VendorBookingAssignment.membership_id,
        )
        .join(
            VendorMembershipPermission,
            VendorMembershipPermission.membership_id == VendorMembership.id,
        )
        .where(VendorBookingAssignment.membership_id.in_(membership_ids))
        .where(
            VendorMembershipPermission.permission == "booking.view",
            VendorMembership.status == "active",
        )
        .order_by(Booking.event_date, Booking.created_at)
    ).all()
    return [booking.to_dict() for booking in bookings]


@vendor_staff_bp.post("/profile/me/bookings/<booking_id>/assignments")
@jwt_required()
def assign_staff_to_booking(booking_id: str):
    vendor = _owner_vendor()
    payload = assignment_schema.load(request.get_json(silent=True) or {})
    booking = db.session.get(Booking, booking_id)
    membership = db.session.get(VendorMembership, payload["membershipId"])
    if booking is None or booking.vendor_id != vendor.id:
        raise ApiError("Vendor booking not found.", 404)
    if membership is None or membership.vendor_id != vendor.id or membership.status != "active":
        raise ApiError("Active vendor staff member not found.", 404)
    assignment = db.session.scalar(
        db.select(VendorBookingAssignment).where(
            VendorBookingAssignment.booking_id == booking.id,
            VendorBookingAssignment.membership_id == membership.id,
        )
    )
    if assignment is None:
        assignment = VendorBookingAssignment(
            booking_id=booking.id,
            membership_id=membership.id,
            assigned_by_user_id=get_jwt_identity(),
        )
        db.session.add(assignment)
        db.session.commit()
    return {"id": assignment.id, "bookingId": assignment.booking_id, "membershipId": assignment.membership_id}, 201


@vendor_staff_bp.delete("/profile/me/bookings/<booking_id>/assignments/<membership_id>")
@jwt_required()
def unassign_staff_from_booking(booking_id: str, membership_id: str):
    vendor = _owner_vendor()
    assignment = db.session.scalar(
        db.select(VendorBookingAssignment)
        .join(Booking)
        .join(VendorMembership)
        .where(
            VendorBookingAssignment.booking_id == booking_id,
            VendorMembership.id == membership_id,
            VendorMembership.vendor_id == vendor.id,
            Booking.vendor_id == vendor.id,
        )
    )
    if assignment is None:
        raise ApiError("Vendor booking assignment not found.", 404)
    db.session.delete(assignment)
    db.session.commit()
    return "", 204
