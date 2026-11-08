import csv
from datetime import date, datetime, time, timedelta, timezone
from decimal import Decimal
from io import StringIO

from flask import Blueprint, Response, request
from flask_jwt_extended import get_jwt_identity
from marshmallow import Schema, fields, validate

from app.core.exceptions import ApiError
from app.core.permissions import roles_required
from app.extensions import db
from app.models.audit_log import AuditLog
from app.models.booking import Booking
from app.models.event import Event
from app.models.invitation import InvitationTemplate
from app.models.payment import Payment
from app.models.platform import CommissionRule, PlatformCategory
from app.models.security_event import SecurityEvent
from app.models.user import User
from app.models.user_session import UserSession
from app.models.vendor import VendorProfile
from app.models.venue import Venue
from app.services.security_event_service import record_security_event

admin_bp = Blueprint("admin", __name__)


class VenueCreateSchema(Schema):
    vendorId = fields.String(load_default=None, allow_none=True)
    name = fields.String(required=True, validate=validate.Length(min=2, max=180))
    city = fields.String(required=True, validate=validate.Length(min=2, max=120))
    capacity = fields.Integer(required=True, validate=validate.Range(min=1, max=100000))
    pricePerDay = fields.Decimal(required=True, as_string=False, validate=validate.Range(min=0))
    amenities = fields.List(fields.String(), load_default=list)
    imageUrl = fields.String(load_default=None, allow_none=True)


class InvitationTemplateCreateSchema(Schema):
    name = fields.String(required=True, validate=validate.Length(min=2, max=140))
    category = fields.String(required=True, validate=validate.Length(min=2, max=80))
    previewUrl = fields.String(load_default=None, allow_none=True, validate=validate.Length(max=500))
    price = fields.Decimal(load_default=0, as_string=False, validate=validate.Range(min=0))


class CategoryCreateSchema(Schema):
    name = fields.String(required=True, validate=validate.Length(min=2, max=100))


class CategoryStatusSchema(Schema):
    isActive = fields.Boolean(required=True)


class CommissionRuleSchema(Schema):
    category = fields.String(required=True, validate=validate.Length(min=2, max=100))
    ratePercent = fields.Decimal(
        required=True,
        as_string=False,
        validate=validate.Range(min=0, max=100),
    )
    effectiveFrom = fields.Date(required=True)


venue_create_schema = VenueCreateSchema()
invitation_template_schema = InvitationTemplateCreateSchema()
category_create_schema = CategoryCreateSchema()
category_status_schema = CategoryStatusSchema()
commission_rule_schema = CommissionRuleSchema()


def _serialize_category(category: PlatformCategory) -> dict[str, object]:
    return {
        "id": category.id,
        "name": category.name,
        "isActive": category.is_active,
    }


def _serialize_commission_rule(rule: CommissionRule) -> dict[str, object]:
    return {
        "id": rule.id,
        "category": rule.category_name,
        "ratePercent": float(rule.rate_percent),
        "effectiveFrom": rule.effective_from.isoformat(),
    }


@admin_bp.get("/categories")
@roles_required("admin")
def list_categories():
    categories = db.session.scalars(
        db.select(PlatformCategory).order_by(PlatformCategory.name)
    ).all()
    return [_serialize_category(category) for category in categories]


@admin_bp.post("/categories")
@roles_required("admin")
def create_category():
    payload = category_create_schema.load(request.get_json(silent=True) or {})
    name = payload["name"].strip()
    if db.session.scalar(
        db.select(PlatformCategory.id).where(db.func.lower(PlatformCategory.name) == name.lower())
    ):
        raise ApiError("A category with this name already exists.", 409)

    category = PlatformCategory(name=name, is_active=True)
    db.session.add(category)
    db.session.flush()
    db.session.add(
        AuditLog(
            actor_id=get_jwt_identity(),
            action="platform_category.created",
            target_type="platform_category",
            target_id=category.id,
            details={"name": category.name},
        )
    )
    db.session.commit()
    return _serialize_category(category), 201


@admin_bp.patch("/categories/<category_id>")
@roles_required("admin")
def update_category(category_id: str):
    category = db.session.get(PlatformCategory, category_id)
    if category is None:
        raise ApiError("Category not found.", 404)
    payload = category_status_schema.load(request.get_json(silent=True) or {})
    category.is_active = payload["isActive"]
    db.session.add(
        AuditLog(
            actor_id=get_jwt_identity(),
            action="platform_category.status.updated",
            target_type="platform_category",
            target_id=category.id,
            details={"name": category.name, "isActive": category.is_active},
        )
    )
    db.session.commit()
    return _serialize_category(category)


@admin_bp.get("/commissions")
@roles_required("admin")
def list_commission_rules():
    rules = db.session.scalars(
        db.select(CommissionRule).order_by(
            CommissionRule.category_name,
            CommissionRule.effective_from.desc(),
        )
    ).all()
    return [_serialize_commission_rule(rule) for rule in rules]


@admin_bp.post("/commissions")
@roles_required("admin")
def create_commission_rule():
    payload = commission_rule_schema.load(request.get_json(silent=True) or {})
    category = payload["category"].strip()
    known_category = db.session.scalar(
        db.select(PlatformCategory).where(
            db.func.lower(PlatformCategory.name) == category.lower(),
            PlatformCategory.is_active.is_(True),
        )
    )
    if known_category is None:
        raise ApiError("Choose an active marketplace category.", 400)
    if db.session.scalar(
        db.select(CommissionRule.id).where(
            CommissionRule.category_name == known_category.name,
            CommissionRule.effective_from == payload["effectiveFrom"],
        )
    ):
        raise ApiError("A commission rule already exists for that category and date.", 409)

    rule = CommissionRule(
        category_name=known_category.name,
        rate_percent=payload["ratePercent"],
        effective_from=payload["effectiveFrom"],
        created_by_user_id=get_jwt_identity(),
    )
    db.session.add(rule)
    db.session.flush()
    db.session.add(
        AuditLog(
            actor_id=get_jwt_identity(),
            action="commission_rule.created",
            target_type="commission_rule",
            target_id=rule.id,
            details={
                "category": rule.category_name,
                "ratePercent": float(rule.rate_percent),
                "effectiveFrom": rule.effective_from.isoformat(),
            },
        )
    )
    db.session.commit()
    return _serialize_commission_rule(rule), 201


@admin_bp.get("/reports")
@roles_required("admin")
def export_report():
    report_type = request.args.get("type", "")
    if report_type not in {"bookings", "payments", "commissions"}:
        raise ApiError("type must be bookings, payments, or commissions.")
    try:
        from_date = date.fromisoformat(request.args["from"]) if request.args.get("from") else None
        to_date = date.fromisoformat(request.args["to"]) if request.args.get("to") else None
    except ValueError as error:
        raise ApiError("Report dates must use YYYY-MM-DD format.") from error
    if from_date and to_date and from_date > to_date:
        raise ApiError("The report start date must not be after its end date.")

    start = datetime.combine(from_date, time.min, tzinfo=timezone.utc) if from_date else None
    end = (
        datetime.combine(to_date + timedelta(days=1), time.min, tzinfo=timezone.utc)
        if to_date
        else None
    )
    output = StringIO(newline="")
    writer = csv.writer(output)

    if report_type == "bookings":
        writer.writerow(
            ["Booking ID", "Event", "Vendor", "Category", "Service", "Event Date", "Amount", "Status", "Created At"]
        )
        query = db.select(Booking).order_by(Booking.created_at.desc())
        if start:
            query = query.where(Booking.created_at >= start)
        if end:
            query = query.where(Booking.created_at < end)
        for booking in db.session.scalars(query).all():
            writer.writerow(
                [
                    booking.id,
                    booking.event.name,
                    booking.vendor.business_name,
                    booking.vendor.category,
                    booking.service_name,
                    booking.event_date.isoformat(),
                    booking.amount,
                    booking.status,
                    booking.created_at.isoformat(),
                ]
            )
    else:
        writer.writerow(
            ["Payment ID", "Invoice", "Event", "Vendor", "Category", "Amount", "Currency", "Status", "Paid At"]
            + (["Commission Rate (%)", "Commission Amount"] if report_type == "commissions" else [])
        )
        query = (
            db.select(Payment, Booking, VendorProfile, Event)
            .outerjoin(Booking, Payment.booking_id == Booking.id)
            .outerjoin(VendorProfile, Booking.vendor_id == VendorProfile.id)
            .outerjoin(Event, Booking.event_id == Event.id)
            .order_by(Payment.created_at.desc())
        )
        if start:
            query = query.where(Payment.created_at >= start)
        if end:
            query = query.where(Payment.created_at < end)
        rows = db.session.execute(query).all()
        commission_rules: dict[str, list[CommissionRule]] = {}
        if report_type == "commissions":
            all_rules = db.session.scalars(
                db.select(CommissionRule).order_by(CommissionRule.effective_from)
            ).all()
            for rule in all_rules:
                commission_rules.setdefault(rule.category_name, []).append(rule)

        for payment, booking, vendor, event in rows:
            if report_type == "commissions" and payment.status != "paid":
                continue
            row = [
                payment.id,
                payment.invoice_number,
                event.name if event else "",
                vendor.business_name if vendor else "",
                vendor.category if vendor else "",
                payment.amount,
                payment.currency,
                payment.status,
                payment.paid_at.isoformat() if payment.paid_at else "",
            ]
            if report_type == "commissions":
                paid_on = payment.paid_at.date() if payment.paid_at else payment.created_at.date()
                applicable = [
                    rule
                    for rule in commission_rules.get(vendor.category if vendor else "", [])
                    if rule.effective_from <= paid_on
                ]
                rate = applicable[-1].rate_percent if applicable else Decimal("0")
                row.extend([rate, (payment.amount * rate / Decimal("100")).quantize(Decimal("0.01"))])
            writer.writerow(row)

    filename = f"utsav-{report_type}-report.csv"
    return Response(
        output.getvalue(),
        mimetype="text/csv",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


@admin_bp.get("/dashboard")
@roles_required("admin")
def get_dashboard():
    def count(query) -> int:
        return int(db.session.scalar(query) or 0)

    booking_counts = dict(
        db.session.execute(
            db.select(Booking.status, db.func.count(Booking.id)).group_by(Booking.status)
        ).all()
    )
    payment_counts = dict(
        db.session.execute(
            db.select(Payment.status, db.func.count(Payment.id)).group_by(Payment.status)
        ).all()
    )
    paid_amount = db.session.scalar(
        db.select(db.func.coalesce(db.func.sum(Payment.amount), 0)).where(Payment.status == "paid")
    )

    recent_bookings = db.session.scalars(
        db.select(Booking).order_by(Booking.created_at.desc()).limit(10)
    ).all()
    recent_payments = db.session.execute(
        db.select(Payment, Booking.service_name, Event.name)
        .outerjoin(Booking, Payment.booking_id == Booking.id)
        .outerjoin(Event, Booking.event_id == Event.id)
        .order_by(Payment.created_at.desc())
        .limit(10)
    ).all()

    return {
        "metrics": {
            "users": {
                "total": count(db.select(db.func.count(User.id))),
                "active": count(
                    db.select(db.func.count(User.id)).where(User.is_active.is_(True))
                ),
            },
            "events": count(db.select(db.func.count(Event.id))),
            "vendors": {
                "total": count(db.select(db.func.count(VendorProfile.id))),
                "pending": count(
                    db.select(db.func.count(VendorProfile.id)).where(
                        VendorProfile.verification_status == "pending"
                    )
                ),
                "verified": count(
                    db.select(db.func.count(VendorProfile.id)).where(
                        VendorProfile.verification_status == "verified"
                    )
                ),
            },
            "bookings": {
                "total": sum(booking_counts.values()),
                "requested": booking_counts.get("requested", 0),
                "confirmed": booking_counts.get("confirmed", 0),
                "completed": booking_counts.get("completed", 0),
                "cancelled": booking_counts.get("cancelled", 0),
            },
            "payments": {
                "total": sum(payment_counts.values()),
                "paid": payment_counts.get("paid", 0),
                "pending": payment_counts.get("pending", 0),
                "failed": payment_counts.get("failed", 0),
                "paidAmount": float(paid_amount or 0),
            },
        },
        "recentBookings": [
            {
                "id": booking.id,
                "eventName": booking.event.name,
                "vendorName": booking.vendor.business_name,
                "serviceName": booking.service_name,
                "eventDate": booking.event_date.isoformat(),
                "amount": float(booking.amount),
                "status": booking.status,
                "createdAt": booking.created_at.isoformat(),
            }
            for booking in recent_bookings
        ],
        "recentPayments": [
            {
                "id": payment.id,
                "invoiceNumber": payment.invoice_number,
                "eventName": event_name,
                "serviceName": service_name,
                "amount": float(payment.amount),
                "currency": payment.currency,
                "status": payment.status,
                "paidAt": payment.paid_at.isoformat() if payment.paid_at else None,
                "createdAt": payment.created_at.isoformat(),
            }
            for payment, service_name, event_name in recent_payments
        ],
    }


@admin_bp.get("/users")
@roles_required("admin")
def list_users():
    users = db.session.scalars(db.select(User).order_by(User.created_at.desc())).all()
    return [
        {
            **user.to_dict(),
            "status": "active" if user.is_active else "suspended",
            "verified": user.is_verified,
        }
        for user in users
    ]


@admin_bp.patch("/users/<user_id>/status")
@roles_required("admin")
def update_user_status(user_id: str):
    user = db.session.get(User, user_id)
    if user is None:
        raise ApiError("User not found.", 404)

    body = request.get_json(silent=True)
    if not isinstance(body, dict) or body.get("status") not in {"active", "suspended"}:
        raise ApiError("status must be active or suspended.")

    is_active = body["status"] == "active"
    actor_id = get_jwt_identity()
    if not is_active and user.id == actor_id:
        raise ApiError("You cannot suspend your own administrator account.", 409)
    if not is_active and user.role == "admin" and user.is_active:
        active_admins = db.session.scalar(
            db.select(db.func.count(User.id)).where(
                User.role == "admin",
                User.is_active.is_(True),
            )
        ) or 0
        if active_admins <= 1:
            raise ApiError("The last active administrator cannot be suspended.", 409)

    status_changed = user.is_active != is_active
    user.is_active = is_active
    if status_changed:
        user.security_version += 1
        now = datetime.now(timezone.utc)
        sessions = db.session.scalars(
            db.select(UserSession).where(
                UserSession.user_id == user.id,
                UserSession.revoked_at.is_(None),
            )
        ).all()
        for session in sessions:
            session.revoked_at = now
        record_security_event(
            "admin.user_status_changed",
            "succeeded",
            user_id=actor_id,
            resource_type="user",
            resource_id=user.id,
            metadata={"status": body["status"]},
        )
    db.session.add(
        AuditLog(
            actor_id=actor_id,
            action="user.status.updated",
            target_type="user",
            target_id=user.id,
            details={"status": body["status"]},
        )
    )
    db.session.commit()
    return {
        **user.to_dict(),
        "status": "active" if user.is_active else "suspended",
        "verified": user.is_verified,
    }


@admin_bp.get("/audit-logs")
@roles_required("admin")
def list_audit_logs():
    rows = db.session.execute(
        db.select(AuditLog, User.email)
        .outerjoin(User, AuditLog.actor_id == User.id)
        .order_by(AuditLog.created_at.desc())
        .limit(200)
    ).all()
    return [
        {
            "id": log.id,
            "actor": actor_email or "System",
            "action": log.action,
            "target": (
                f"{log.target_type} · {log.target_id}"
                if log.target_type and log.target_id
                else log.target_type or log.target_id or "—"
            ),
            "details": log.details,
            "createdAt": log.created_at.isoformat(),
        }
        for log, actor_email in rows
    ]


@admin_bp.get("/security-events")
@roles_required("admin")
def list_security_events():
    statement = db.select(SecurityEvent).order_by(SecurityEvent.created_at.desc()).limit(200)
    user_id = request.args.get("userId")
    event_type = request.args.get("eventType")
    if user_id:
        statement = statement.where(SecurityEvent.user_id == user_id)
    if event_type:
        statement = statement.where(SecurityEvent.event_type == event_type[:80])
    events = db.session.scalars(statement).all()
    return [{
        "id": item.id,
        "userId": item.user_id,
        "eventType": item.event_type,
        "result": item.result,
        "resourceType": item.resource_type,
        "resourceId": item.resource_id,
        "ipAddress": item.ip_address,
        "userAgent": item.user_agent,
        "metadata": item.metadata_json,
        "createdAt": item.created_at.isoformat(),
    } for item in events]


@admin_bp.get("/vendors")
@roles_required("admin")
def list_vendor_profiles():
    vendors = db.session.scalars(
        db.select(VendorProfile).order_by(VendorProfile.created_at.desc())
    ).all()
    return [
        {**vendor.to_dict(), "verificationStatus": vendor.verification_status}
        for vendor in vendors
    ]


@admin_bp.patch("/vendors/<vendor_id>/verification")
@roles_required("admin")
def update_vendor_verification(vendor_id: str):
    vendor = db.session.get(VendorProfile, vendor_id)
    if vendor is None:
        raise ApiError("Vendor profile not found.", 404)
    body = request.get_json(silent=True) or {}
    status = body.get("status")
    if status not in {"verified", "rejected", "pending"}:
        raise ApiError("status must be verified, rejected, or pending.")
    vendor.verification_status = status
    db.session.add(AuditLog(
        actor_id=get_jwt_identity(),
        action="vendor.verification.updated",
        target_type="vendor",
        target_id=vendor.id,
        details={"status": status},
    ))
    db.session.commit()
    return {**vendor.to_dict(), "verificationStatus": vendor.verification_status}


@admin_bp.post("/venues")
@roles_required("admin")
def create_venue():
    payload = venue_create_schema.load(request.get_json(silent=True) or {})
    if payload.get("vendorId") and db.session.get(VendorProfile, payload["vendorId"]) is None:
        raise ApiError("Vendor profile not found.", 404)
    venue = Venue(
        vendor_id=payload.get("vendorId"),
        name=payload["name"].strip(),
        city=payload["city"].strip(),
        capacity=payload["capacity"],
        price_per_day=payload["pricePerDay"],
        amenities=payload.get("amenities", []),
        image_url=payload.get("imageUrl"),
    )
    db.session.add(venue)
    db.session.add(AuditLog(
        actor_id=get_jwt_identity(),
        action="venue.created",
        target_type="venue",
        target_id=venue.id,
        details={"name": venue.name},
    ))
    db.session.commit()
    return venue.to_dict(), 201


@admin_bp.post("/invitation-templates")
@roles_required("admin")
def create_invitation_template():
    payload = invitation_template_schema.load(request.get_json(silent=True) or {})
    template = InvitationTemplate(
        name=payload["name"].strip(),
        category=payload["category"].strip(),
        preview_url=payload.get("previewUrl"),
        price=payload["price"],
        is_published=True,
    )
    db.session.add(template)
    db.session.add(AuditLog(
        actor_id=get_jwt_identity(),
        action="invitation_template.created",
        target_type="invitation_template",
        details={"name": template.name},
    ))
    db.session.commit()
    return {
        "id": template.id,
        "name": template.name,
        "category": template.category,
        "previewUrl": template.preview_url,
        "price": float(template.price),
    }, 201
