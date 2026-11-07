from datetime import date, datetime, timezone

from flask import Blueprint
from flask_jwt_extended import get_jwt_identity, jwt_required
from sqlalchemy import or_

from app.core.exceptions import ApiError
from app.extensions import db
from app.models.booking import Booking
from app.models.event import Event
from app.models.guest import Guest
from app.models.payment import Payment
from app.models.user import User
from app.models.vendor import Service, VendorProfile
from app.models.workspace import FamilyMembership, FamilyWorkspace


dashboard_bp = Blueprint("dashboard", __name__)


def _family_workspaces_for_user(user: User) -> list[FamilyWorkspace]:
    workspaces = db.session.scalars(
        db.select(FamilyWorkspace)
        .outerjoin(
            FamilyMembership,
            FamilyMembership.workspace_id == FamilyWorkspace.id,
        )
        .where(
            or_(
                FamilyWorkspace.owner_user_id == user.id,
                (FamilyMembership.user_id == user.id),
            )
        )
        .distinct()
    ).all()
    return [workspace for workspace in workspaces if workspace.owner_user_id == user.id or db.session.scalar(
        db.select(FamilyMembership.id).where(
            FamilyMembership.workspace_id == workspace.id,
            FamilyMembership.user_id == user.id,
            FamilyMembership.status == "active",
        )
    ) is not None]


def _family_events_for_user(user: User) -> list[Event]:
    owner_ids = [workspace.owner_user_id for workspace in _family_workspaces_for_user(user)]
    if not owner_ids:
        return []
    return db.session.scalars(
        db.select(Event)
        .where(Event.owner_id.in_(owner_ids))
        .order_by(Event.date.asc())
    ).all()


def _serialize_family_dashboard(user: User) -> dict[str, object]:
    events = _family_events_for_user(user)
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

    workspace = None
    if user.role == "family":
        workspace = db.session.scalar(
            db.select(FamilyWorkspace).where(FamilyWorkspace.owner_user_id == user.id)
        )
    if workspace is None:
        workspaces = _family_workspaces_for_user(user)
        workspace = workspaces[0] if workspaces else None

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


def _vendor_dashboard_for_user(user: User) -> dict[str, object]:
    vendor = user.vendor_profile or db.session.scalar(
        db.select(VendorProfile).where(VendorProfile.user_id == user.id)
    )
    if vendor is None:
        raise ApiError("Create a vendor profile before viewing your dashboard.", 404)

    services = db.session.scalars(
        db.select(Service).where(Service.vendor_id == vendor.id)
    ).all()
    bookings = db.session.scalars(
        db.select(Booking).where(Booking.vendor_id == vendor.id)
    ).all()
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
    if user.role == "admin":
        return _admin_dashboard_for_user(user)
    if user.role == "family":
        return _serialize_family_dashboard(user)
    if user.role == "vendor":
        return _vendor_dashboard_for_user(user)
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
