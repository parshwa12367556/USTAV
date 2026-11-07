from datetime import date
from decimal import Decimal

from flask_jwt_extended import create_access_token
from werkzeug.security import generate_password_hash

from app.extensions import db
from app.models.booking import Booking
from app.models.event import Event
from app.models.user import User
from app.models.vendor import VendorProfile


def test_booking_create_filter_and_cancel(client, auth_headers, app):
    event = client.post(
        "/api/v1/events",
        json={"name": "Booking Wedding", "type": "Wedding", "date": "2027-08-03"},
        headers=auth_headers,
    ).json
    with app.app_context():
        vendor_user = User(
            name="Booking Vendor",
            email="booking-vendor@example.com",
            password_hash=generate_password_hash("vendor-password-123"),
            role="vendor",
            is_verified=True,
        )
        db.session.add(vendor_user)
        db.session.flush()
        profile = VendorProfile(
            user_id=vendor_user.id,
            business_name="Verified Garden",
            category="Venue",
            city="Jaipur",
            verification_status="verified",
        )
        db.session.add(profile)
        db.session.commit()
        vendor_id = profile.id

    created = client.post(
        "/api/v1/bookings",
        json={
            "eventId": event["id"],
            "vendorId": vendor_id,
            "serviceName": "Garden hire",
            "eventDate": "2027-08-03",
            "amount": 50000,
        },
        headers=auth_headers,
    )
    assert created.status_code == 201
    assert len(client.get(
        f"/api/v1/bookings?eventId={event['id']}",
        headers=auth_headers,
    ).json) == 1

    cancelled = client.patch(
        f"/api/v1/bookings/{created.json['id']}",
        json={"status": "cancelled"},
        headers=auth_headers,
    )
    assert cancelled.status_code == 200
    assert cancelled.json["status"] == "cancelled"


def test_vendor_can_confirm_own_booking_but_family_cannot(client, auth_headers, app):
    event = client.post(
        "/api/v1/events",
        json={"name": "Vendor Decision Wedding", "type": "Wedding", "date": "2027-08-03"},
        headers=auth_headers,
    ).json
    with app.app_context():
        vendor_user = User(
            name="Decision Vendor",
            email="decision-vendor@example.com",
            password_hash=generate_password_hash("vendor-password-123"),
            role="vendor",
            is_verified=True,
        )
        db.session.add(vendor_user)
        db.session.flush()
        vendor = VendorProfile(
            user_id=vendor_user.id,
            business_name="Decision Garden",
            category="Venue",
            city="Jaipur",
            verification_status="verified",
        )
        db.session.add(vendor)
        db.session.commit()
        vendor_token = create_access_token(
            vendor_user.id,
            additional_claims={"role": "vendor"},
        )
        vendor_id = vendor.id

    created = client.post(
        "/api/v1/bookings",
        json={
            "eventId": event["id"],
            "vendorId": vendor_id,
            "serviceName": "Garden hire",
            "eventDate": "2027-08-03",
            "amount": 50000,
        },
        headers=auth_headers,
    )
    booking_id = created.json["id"]
    family_confirm = client.patch(
        f"/api/v1/bookings/{booking_id}",
        json={"status": "confirmed"},
        headers=auth_headers,
    )
    vendor_confirm = client.patch(
        f"/api/v1/bookings/{booking_id}",
        json={"status": "confirmed"},
        headers={"Authorization": f"Bearer {vendor_token}"},
    )
    assert family_confirm.status_code == 403
    assert vendor_confirm.status_code == 200
    assert vendor_confirm.json["status"] == "confirmed"


def test_vendor_cannot_update_another_vendors_booking(client, auth_headers, app):
    event = client.post(
        "/api/v1/events",
        json={"name": "Private Booking Wedding", "type": "Wedding", "date": "2027-08-03"},
        headers=auth_headers,
    ).json
    with app.app_context():
        vendor_users = []
        for index in range(2):
            user = User(
                name=f"Private Vendor {index}",
                email=f"private-vendor-{index}@example.com",
                password_hash=generate_password_hash("vendor-password-123"),
                role="vendor",
                is_verified=True,
            )
            db.session.add(user)
            db.session.flush()
            profile = VendorProfile(
                user_id=user.id,
                business_name=f"Private Garden {index}",
                category="Venue",
                city="Jaipur",
                verification_status="verified",
            )
            db.session.add(profile)
            db.session.flush()
            vendor_users.append((user.id, profile.id))
        booking = Booking(
            event_id=event["id"],
            vendor_id=vendor_users[0][1],
            service_name="Garden hire",
            event_date=date(2027, 8, 3),
            amount=Decimal("50000"),
            status="requested",
        )
        db.session.add(booking)
        db.session.commit()
        booking_id = booking.id
        token = create_access_token(
            vendor_users[1][0],
            additional_claims={"role": "vendor"},
        )
    response = client.patch(
        f"/api/v1/bookings/{booking_id}",
        json={"status": "confirmed"},
        headers={"Authorization": f"Bearer {token}"},
    )
    assert response.status_code == 404


def test_checkout_does_not_claim_success_without_payment_provider(client, auth_headers, app):
    with app.app_context():
        user = User(
            name="Booking Vendor",
            email="checkout-vendor@example.com",
            password_hash=generate_password_hash("vendor-password-123"),
            role="vendor",
            is_verified=True,
        )
        db.session.add(user)
        db.session.flush()
        vendor = VendorProfile(
            user_id=user.id,
            business_name="Checkout Venue",
            category="Venue",
            city="Jaipur",
            verification_status="verified",
        )
        db.session.add(vendor)
        db.session.flush()
        event = Event(
            owner_id="",
            name="Checkout Wedding",
            event_type="Wedding",
            date=date(2027, 9, 1),
        )
        event.owner_id = db.session.scalar(db.select(User.id).where(User.email == "priya@example.com"))
        db.session.add(event)
        db.session.flush()
        booking = Booking(
            event_id=event.id,
            vendor_id=vendor.id,
            service_name="Venue hire",
            event_date=date(2027, 9, 1),
            amount=Decimal("1000"),
        )
        db.session.add(booking)
        db.session.commit()
        booking_id = booking.id

    response = client.post(
        "/api/v1/payments/checkout",
        json={"bookingId": booking_id},
        headers=auth_headers,
    )
    assert response.status_code == 503
    assert "not configured" in response.json["message"]
