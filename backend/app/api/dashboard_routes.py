from datetime import date, datetime, timezone

from flask import Blueprint
from flask_jwt_extended import get_jwt, get_jwt_identity, jwt_required

from app.core.exceptions import ApiError
from app.extensions import db
from app.models.booking import Booking
from app.models.event import Event
from app.models.guest import Guest
from app.models.payment import Payment
from app.models.user import User
from app.models.vendor import Service, VendorProfile
from app.models.workspace import FamilyMembership, FamilyWorkspace
from app.models.vendor_staff import (
    VendorMembership,
    VendorMembershipPermission,
    VendorBookingAssignment,
)
from app.services.workspace_service import accessible_event_ids


dashboard_bp = Blueprint("dashboard", __name__)


def _family_events_for_user(user: User, membership_id: str | None) -> list[Event]:
    return db.session.scalars(
        db.select(Event)
        .where(
            Event.id.in_(
                accessible_event_ids(user.id, "event.view", membership_id)
            )
        )
        .order_by(Event.date.asc())
    ).all()


def _serialize_family_dashboard(
    user: User, membership_id: str | None
) -> dict[str, object]:
    events = _family_events_for_user(user, membership_id)
    today = date.today()
    total_budget = sum(float(event.budget or 0) for event in events)
    spent_total = 0.0
    upcoming = 0
    guest_count = 0
    accepted = 0
    declined = 0
    pending = 0
    for event in events:
        if event.date >= today:
            upcoming += 1
        for guest in event.guests:
            guest_count += 1
            if guest.rsvp_status == "attending":
                accepted += 1
            elif guest.rsvp_status == "declined":
                declined += 1
            else:
                pending += 1
        spent_total += float(event.budget or 0) * 0.35

    membership = db.session.get(FamilyMembership, membership_id) if membership_id else None
    workspace = (
        db.session.get(FamilyWorkspace, membership.workspace_id)
        if membership is not None
        and membership.user_id == user.id
        and membership.status == "active"
        else None
    )
    if workspace is None and membership_id is None and user.role == "family":
        workspace = db.session.scalar(
            db.select(FamilyWorkspace).where(FamilyWorkspace.owner_user_id == user.id)
        )

    return {
        "role": user.role,
        "workspace": {
            "id": workspace.id if workspace else None,
            "name": workspace.name if workspace else "Family Workspace",
        },
        "metrics": {
            "totalEvents": len(events),
            "upcomingEvents": upcoming,
            "totalWeddingFunctions": sum(len(event.functions) for event in events),
            "totalInvitedGuests": guest_count,
            "rsvpAccepted": accepted,
            "rsvpDeclined": declined,
            "rsvpPending": pending,
            "activeVenueBookings": 0,
            "vendorBookings": 0,
            "totalBudget": total_budget,
            "amountSpent": spent_total,
            "pendingPayments": 0,
        },
        "recentActivities": [
            {"title": event.name, "detail": event.event_type, "date": event.date.isoformat()}
            for event in events[:5]
        ],
        "eventTimeline": [
            {"id": event.id, "name": event.name, "date": event.date.isoformat(), "status": event.status}
            for event in events[:5]
        ],
    }


def _vendor_dashboard_for_user(
    user: User, membership_id: str | None
) -> dict[str, object]:
    membership = db.session.get(VendorMembership, membership_id) if membership_id else None
    if membership_id and (
        membership is None
        or membership.user_id != user.id
        or membership.status != "active"
    ):
        raise ApiError("The active vendor workspace is unavailable.", 403)
    if membership is None:
        membership = db.session.scalar(
            db.select(VendorMembership).where(
                VendorMembership.user_id == user.id,
                VendorMembership.role == "owner",
                VendorMembership.status == "active",
            )
        )
    if membership is None:
        raise ApiError("Create a vendor profile before viewing your dashboard.", 404)
    vendor = db.session.get(VendorProfile, membership.vendor_id)
    if vendor is None:
        raise ApiError("The active vendor workspace is unavailable.", 404)

    services = (
        db.session.scalars(
            db.select(Service).where(Service.vendor_id == vendor.id)
        ).all()
        if membership.role == "owner"
        else []
    )
    bookings_query = db.select(Booking).where(Booking.vendor_id == vendor.id)
    if membership.role != "owner":
        bookings_query = bookings_query.join(
            VendorBookingAssignment,
            VendorBookingAssignment.booking_id == Booking.id,
        ).join(
            VendorMembershipPermission,
            VendorMembershipPermission.membership_id == membership.id,
        ).where(
            VendorBookingAssignment.membership_id == membership.id,
            VendorMembershipPermission.permission == "booking.view",
        )
    bookings = db.session.scalars(bookings_query).all()
    revenue = sum(float(booking.amount) for booking in bookings if booking.status in {"confirmed", "completed"})
    upcoming = sum(1 for booking in bookings if booking.event_date >= date.today())

    return {
        "role": "vendor",
        "business": {
            "id": vendor.id,
            "name": vendor.business_name,
            "category": vendor.category,
            "verificationStatus": vendor.verification_status,
        },
        "metrics": {
            "totalServices": len(services),
            "activePackages": 0,
            "newQuotationRequests": 0,
            "pendingQuotations": 0,
            "confirmedBookings": sum(1 for booking in bookings if booking.status == "confirmed"),
            "upcomingBookings": upcoming,
            "revenue": revenue,
            "paymentSummary": {
                "paid": 0,
                "pending": 0,
            },
        },
        "recentBookings": [booking.to_dict() for booking in bookings[:5]],
    }


def _admin_dashboard_for_user(_user: User) -> dict[str, object]:
    user_count = db.session.scalar(db.select(db.func.count()).select_from(User)) or 0
    family_count = db.session.scalar(db.select(db.func.count()).select_from(FamilyWorkspace)) or 0
    vendor_count = db.session.scalar(db.select(db.func.count()).select_from(VendorProfile)) or 0
    event_count = db.session.scalar(db.select(db.func.count()).select_from(Event)) or 0
    booking_count = db.session.scalar(db.select(db.func.count()).select_from(Booking)) or 0
    payment_total = db.session.scalar(db.select(db.func.coalesce(db.func.sum(Payment.amount), 0)).select_from(Payment)) or 0

    return {
        "role": "admin",
        "metrics": {
            "totalUsers": user_count,
            "totalFamilyWorkspaces": family_count,
            "totalVendors": vendor_count,
            "pendingVendorVerifications": db.session.scalar(
                db.select(db.func.count()).select_from(VendorProfile).where(VendorProfile.verification_status == "pending")
            ) or 0,
            "totalEvents": event_count,
            "totalBookings": booking_count,
            "platformTransactions": float(payment_total),
            "reportedIssues": 0,
        },
        "recentActivity": []
    }


@dashboard_bp.get("")
@jwt_required()
def personal_dashboard():
    user = db.session.get(User, get_jwt_identity())
    if user is None or not user.is_active:
        raise ApiError("The authenticated account is not available.", 401)
    membership_id = get_jwt().get("membership_id")
    family_membership = (
        db.session.get(FamilyMembership, membership_id) if membership_id else None
    )
    vendor_membership = (
        db.session.get(VendorMembership, membership_id) if membership_id else None
    )
    if family_membership and family_membership.user_id == user.id:
        return _serialize_family_dashboard(user, membership_id)
    if vendor_membership and vendor_membership.user_id == user.id:
        return _vendor_dashboard_for_user(user, membership_id)
    if user.role == "admin" and membership_id in (None, f"admin:{user.id}"):
        return _admin_dashboard_for_user(user)
    if membership_id is None and user.role == "family":
        return _serialize_family_dashboard(user, None)
    if membership_id is None and user.role == "vendor":
        return _vendor_dashboard_for_user(user, None)
    return {"role": user.role, "metrics": {}, "recentActivity": []}


@dashboard_bp.get("/family")
@jwt_required()
def family_dashboard():
    user = db.session.get(User, get_jwt_identity())
    if user is None:
        raise ApiError("The authenticated account is not available.", 401)
    if user.role not in {"family"}:
        raise ApiError("This dashboard is only available to family accounts.", 403)
    return _serialize_family_dashboard(user)


@dashboard_bp.get("/family-member")
@jwt_required()
def family_member_dashboard():
    user = db.session.get(User, get_jwt_identity())
    if user is None:
        raise ApiError("The authenticated account is not available.", 401)
    if user.role != "family":
        raise ApiError("Only family members can access this dashboard.", 403)
    return _serialize_family_dashboard(user)


@dashboard_bp.get("/vendor")
@jwt_required()
def vendor_dashboard():
    user = db.session.get(User, get_jwt_identity())
    if user is None:
        raise ApiError("The authenticated account is not available.", 401)
    if user.role != "vendor":
        raise ApiError("This dashboard is only available to vendor accounts.", 403)
    return _vendor_dashboard_for_user(user)


@dashboard_bp.get("/admin")
@jwt_required()
def admin_dashboard():
    user = db.session.get(User, get_jwt_identity())
    if user is None:
        raise ApiError("The authenticated account is not available.", 401)
    if user.role != "admin":
        raise ApiError("This dashboard is only available to administrators.", 403)
    return _admin_dashboard_for_user(user)
