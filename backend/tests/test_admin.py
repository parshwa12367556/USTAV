from datetime import date, datetime, timezone

from flask_jwt_extended import create_access_token
from werkzeug.security import generate_password_hash

from app.extensions import db
from app.models.booking import Booking
from app.models.event import Event
from app.models.payment import Payment
from app.models.user import User
from app.models.vendor import VendorProfile


def test_admin_can_review_vendor_and_non_admin_cannot(client, app):
    with app.app_context():
        admin = User(
            name="Utsav Admin",
            email="admin@example.com",
            password_hash=generate_password_hash("admin-password-123"),
            role="admin",
            is_verified=True,
        )
        vendor_user = User(
            name="Local Caterer",
            email="vendor@example.com",
            password_hash=generate_password_hash("vendor-password-123"),
            role="vendor",
            is_verified=True,
        )
        db.session.add_all([admin, vendor_user])
        db.session.flush()
        vendor = VendorProfile(
            user_id=vendor_user.id,
            business_name="Local Caterer",
            category="Catering",
            city="Jaipur",
            verification_status="pending",
        )
        db.session.add(vendor)
        db.session.commit()
        admin_headers = {
            "Authorization": f"Bearer {create_access_token(admin.id, additional_claims={'role': 'admin'})}"
        }
        vendor_headers = {
            "Authorization": f"Bearer {create_access_token(vendor_user.id, additional_claims={'role': 'vendor'})}"
        }
        vendor_id = vendor.id

    denied = client.get("/api/v1/admin/vendors", headers=vendor_headers)
    assert denied.status_code == 403

    reviewed = client.patch(
        f"/api/v1/admin/vendors/{vendor_id}/verification",
        json={"status": "verified"},
        headers=admin_headers,
    )
    assert reviewed.status_code == 200
    assert reviewed.json["verificationStatus"] == "verified"

    listings = client.get("/api/v1/admin/vendors", headers=admin_headers)
    assert listings.status_code == 200
    assert listings.json[0]["id"] == vendor_id

    venue = client.post(
        "/api/v1/admin/venues",
        json={
            "name": "The Garden Courtyard",
            "city": "Jaipur",
            "capacity": 220,
            "pricePerDay": 95000,
            "amenities": ["Garden", "Parking"],
        },
        headers=admin_headers,
    )
    assert venue.status_code == 201
    assert venue.json["capacity"] == 220
    assert client.post(
        "/api/v1/admin/venues",
        json={"name": "Unauthorized venue", "city": "Jaipur", "capacity": 50, "pricePerDay": 1000},
        headers=vendor_headers,
    ).status_code == 403

    template = client.post(
        "/api/v1/admin/invitation-templates",
        json={"name": "Marigold Dawn", "category": "Floral", "price": 0},
        headers=admin_headers,
    )
    assert template.status_code == 201
    assert template.json["name"] == "Marigold Dawn"
    assert any(item["id"] == template.json["id"] for item in client.get("/api/v1/invitations/templates").json)


def test_admin_can_suspend_users_and_audit_changes(client, app):
    with app.app_context():
        admin = User(
            name="Primary Admin",
            email="primary-admin@example.com",
            password_hash=generate_password_hash("admin-password-123"),
            role="admin",
            is_verified=True,
        )
        member = User(
            name="Family Member",
            email="member@example.com",
            password_hash=generate_password_hash("member-password-123"),
            role="family",
            is_verified=True,
        )
        db.session.add_all([admin, member])
        db.session.commit()
        admin_id = admin.id
        member_id = member.id
        admin_headers = {
            "Authorization": f"Bearer {create_access_token(admin_id, additional_claims={'role': 'admin'})}"
        }
        member_headers = {
            "Authorization": f"Bearer {create_access_token(member_id, additional_claims={'role': 'family'})}"
        }

    suspended = client.patch(
        f"/api/v1/admin/users/{member_id}/status",
        json={"status": "suspended"},
        headers=admin_headers,
    )
    assert suspended.status_code == 200
    assert suspended.json["status"] == "suspended"
    assert client.get("/api/v1/auth/me", headers=member_headers).status_code == 401

    reactivated = client.patch(
        f"/api/v1/admin/users/{member_id}/status",
        json={"status": "active"},
        headers=admin_headers,
    )
    assert reactivated.status_code == 200
    assert reactivated.json["status"] == "active"

    logs = client.get("/api/v1/admin/audit-logs", headers=admin_headers)
    assert logs.status_code == 200
    assert [row["action"] for row in logs.json[:2]] == [
        "user.status.updated",
        "user.status.updated",
    ]
    assert logs.json[0]["actor"] == "primary-admin@example.com"
    assert logs.json[0]["target"] == f"user · {member_id}"


def test_admin_cannot_suspend_own_account(client, app):
    with app.app_context():
        admin = User(
            name="Only Admin",
            email="only-admin@example.com",
            password_hash=generate_password_hash("admin-password-123"),
            role="admin",
            is_verified=True,
        )
        db.session.add(admin)
        db.session.commit()
        admin_id = admin.id
        headers = {
            "Authorization": f"Bearer {create_access_token(admin_id, additional_claims={'role': 'admin'})}"
        }

    response = client.patch(
        f"/api/v1/admin/users/{admin_id}/status",
        json={"status": "suspended"},
        headers=headers,
    )
    assert response.status_code == 409
    assert response.json["message"] == "You cannot suspend your own administrator account."


def test_admin_dashboard_reports_metrics_and_recent_activity(client, app):
    with app.app_context():
        admin = User(
            name="Dashboard Admin",
            email="dashboard-admin@example.com",
            password_hash=generate_password_hash("admin-password-123"),
            role="admin",
            is_verified=True,
        )
        family = User(
            name="Celebrating Family",
            email="dashboard-family@example.com",
            password_hash=generate_password_hash("family-password-123"),
            role="family",
            is_verified=True,
        )
        vendor_user = User(
            name="Dashboard Vendor",
            email="dashboard-vendor@example.com",
            password_hash=generate_password_hash("vendor-password-123"),
            role="vendor",
            is_verified=True,
        )
        db.session.add_all([admin, family, vendor_user])
        db.session.flush()
        event = Event(
            owner_id=family.id,
            name="Family Celebration",
            event_type="wedding",
            date=date(2030, 5, 1),
        )
        vendor = VendorProfile(
            user_id=vendor_user.id,
            business_name="Celebration Catering",
            category="Catering",
            city="Jaipur",
            verification_status="verified",
        )
        db.session.add_all([event, vendor])
        db.session.flush()
        booking = Booking(
            event_id=event.id,
            vendor_id=vendor.id,
            service_name="Wedding catering",
            event_date=date(2030, 5, 1),
            amount=25000,
            status="confirmed",
        )
        db.session.add(booking)
        db.session.flush()
        db.session.add(
            Payment(
                booking_id=booking.id,
                invoice_number="UTS-ADMIN-DASHBOARD",
                amount=25000,
                currency="INR",
                status="paid",
            )
        )
        admin_headers = {
            "Authorization": f"Bearer {create_access_token(admin.id, additional_claims={'role': 'admin'})}"
        }
        vendor_headers = {
            "Authorization": f"Bearer {create_access_token(vendor_user.id, additional_claims={'role': 'vendor'})}"
        }
        db.session.commit()

    dashboard = client.get("/api/v1/admin/dashboard", headers=admin_headers)
    assert dashboard.status_code == 200
    assert dashboard.json["metrics"]["users"] == {"total": 3, "active": 3}
    assert dashboard.json["metrics"]["events"] == 1
    assert dashboard.json["metrics"]["vendors"] == {"total": 1, "pending": 0, "verified": 1}
    assert dashboard.json["metrics"]["bookings"]["confirmed"] == 1
    assert dashboard.json["metrics"]["payments"]["paidAmount"] == 25000
    assert dashboard.json["recentBookings"][0]["eventName"] == "Family Celebration"
    assert dashboard.json["recentPayments"][0]["invoiceNumber"] == "UTS-ADMIN-DASHBOARD"
    assert client.get("/api/v1/admin/dashboard", headers=vendor_headers).status_code == 403


def test_admin_manages_categories_commissions_and_exports_reports(client, app):
    with app.app_context():
        admin = User(
            name="Platform Admin",
            email="platform-admin@example.com",
            password_hash=generate_password_hash("admin-password-123"),
            role="admin",
            is_verified=True,
        )
        family = User(
            name="Report Family",
            email="report-family@example.com",
            password_hash=generate_password_hash("family-password-123"),
            role="family",
            is_verified=True,
        )
        vendor_user = User(
            name="Report Vendor",
            email="report-vendor@example.com",
            password_hash=generate_password_hash("vendor-password-123"),
            role="vendor",
            is_verified=True,
        )
        db.session.add_all([admin, family, vendor_user])
        db.session.flush()
        event = Event(
            owner_id=family.id,
            name="Commission Test Event",
            event_type="wedding",
            date=date(2030, 7, 1),
        )
        vendor = VendorProfile(
            user_id=vendor_user.id,
            business_name="Report Photography",
            category="Photography",
            city="Jaipur",
            verification_status="verified",
        )
        db.session.add_all([event, vendor])
        db.session.flush()
        booking = Booking(
            event_id=event.id,
            vendor_id=vendor.id,
            service_name="Photography",
            event_date=date(2030, 7, 1),
            amount=10000,
            status="completed",
        )
        db.session.add(booking)
        db.session.flush()
        payment = Payment(
            booking_id=booking.id,
            invoice_number="UTS-COMMISSION-REPORT",
            amount=10000,
            currency="INR",
            status="paid",
            paid_at=datetime(2030, 6, 1, tzinfo=timezone.utc),
        )
        db.session.add(payment)
        vendor_id = vendor.id
        admin_headers = {
            "Authorization": f"Bearer {create_access_token(admin.id, additional_claims={'role': 'admin'})}"
        }
        family_headers = {
            "Authorization": f"Bearer {create_access_token(family.id, additional_claims={'role': 'family'})}"
        }
        db.session.commit()

    created = client.post(
        "/api/v1/admin/categories",
        json={"name": "Photography"},
        headers=admin_headers,
    )
    assert created.status_code == 201
    category_id = created.json["id"]
    assert any(item["id"] == vendor_id for item in client.get("/api/v1/vendors").json)
    duplicate = client.post(
        "/api/v1/admin/categories",
        json={"name": "photography"},
        headers=admin_headers,
    )
    assert duplicate.status_code == 409
    assert client.get("/api/v1/admin/categories", headers=family_headers).status_code == 403

    rule = client.post(
        "/api/v1/admin/commissions",
        json={"category": "Photography", "ratePercent": 5, "effectiveFrom": "2030-01-01"},
        headers=admin_headers,
    )
    assert rule.status_code == 201
    assert rule.json["ratePercent"] == 5
    duplicate_rule = client.post(
        "/api/v1/admin/commissions",
        json={"category": "Photography", "ratePercent": 6, "effectiveFrom": "2030-01-01"},
        headers=admin_headers,
    )
    assert duplicate_rule.status_code == 409

    commission_report = client.get(
        "/api/v1/admin/reports?type=commissions&from=2026-01-01&to=2027-01-01",
        headers=admin_headers,
    )
    assert commission_report.status_code == 200
    assert "text/csv" in commission_report.content_type
    assert b"UTS-COMMISSION-REPORT" in commission_report.data
    assert b"5.00" in commission_report.data
    assert b"500.00" in commission_report.data

    invalid_range = client.get(
        "/api/v1/admin/reports?type=payments&from=2030-07-01&to=2030-06-01",
        headers=admin_headers,
    )
    assert invalid_range.status_code == 400
    assert client.get(
        "/api/v1/admin/reports?type=payments",
        headers=family_headers,
    ).status_code == 403

    deactivated = client.patch(
        f"/api/v1/admin/categories/{category_id}",
        json={"isActive": False},
        headers=admin_headers,
    )
    assert deactivated.status_code == 200
    assert deactivated.json["isActive"] is False
    assert all(item["id"] != vendor_id for item in client.get("/api/v1/vendors").json)
