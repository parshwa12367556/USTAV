from datetime import date
from decimal import Decimal

from flask_jwt_extended import create_access_token
from werkzeug.security import generate_password_hash

from app.extensions import db
from app.models.booking import Booking
from app.models.event import Event
from app.models.user import User
from app.models.vendor import VendorProfile
from app.models.vendor_staff import VendorMembership


def create_vendor_user(app, name, email):
    with app.app_context():
        user = User(
            name=name,
            email=email,
            password_hash=generate_password_hash("vendor-password-123"),
            role="vendor",
            is_verified=True,
        )
        db.session.add(user)
        db.session.commit()
        db.session.flush()
        token = create_access_token(user.id, additional_claims={"role": "vendor"})
        return user.id, token


def test_vendor_staff_invitation_assignment_and_booking_scope(client, app):
    owner_id, owner_token = create_vendor_user(app, "Vendor Owner", "owner@vendor.test")
    staff_id, staff_token = create_vendor_user(app, "Vendor Staff", "staff@vendor.test")
    with app.app_context():
        owner = db.session.get(User, owner_id)
        vendor = VendorProfile(
            user_id=owner.id,
            business_name="Owner Catering",
            category="Catering",
            city="Jaipur",
            verification_status="verified",
        )
        family = User(
            name="Event Owner",
            email="event-owner@family.test",
            password_hash=generate_password_hash("family-password-123"),
            role="family",
            is_verified=True,
        )
        db.session.add_all([vendor, family])
        db.session.flush()
        event = Event(
            owner_id=family.id,
            name="Assigned Wedding",
            event_type="Wedding",
            date=date(2027, 12, 12),
        )
        db.session.add(event)
        db.session.flush()
        booking = Booking(
            event_id=event.id,
            vendor_id=vendor.id,
            service_name="Wedding catering",
            event_date=event.date,
            amount=Decimal("125000"),
            status="confirmed",
        )
        db.session.add(booking)
        db.session.commit()
        booking_id = booking.id
        vendor_id = vendor.id

    owner_headers = {"Authorization": f"Bearer {owner_token}"}
    staff_headers = {"Authorization": f"Bearer {staff_token}"}
    invitation = client.post(
        "/api/v1/vendors/profile/me/staff/invitations",
        json={"email": "staff@vendor.test"},
        headers=owner_headers,
    )
    assert invitation.status_code == 201
    accepted = client.post(
        "/api/v1/vendors/staff/invitations/accept",
        json={"token": invitation.json["acceptanceToken"]},
        headers=staff_headers,
    )
    assert accepted.status_code == 200
    membership_id = accepted.json["membership"]["id"]
    assigned = client.post(
        f"/api/v1/vendors/profile/me/bookings/{booking_id}/assignments",
        json={"membershipId": membership_id},
        headers=owner_headers,
    )
    assert assigned.status_code == 201

    staff_bookings = client.get("/api/v1/bookings", headers=staff_headers)
    assert [item["id"] for item in staff_bookings.json] == [booking_id]
    assert client.get("/api/v1/vendors/profile/me/staff", headers=staff_headers).status_code == 403
    completed = client.patch(
        f"/api/v1/bookings/{booking_id}",
        json={"status": "completed"},
        headers=staff_headers,
    )
    assert completed.status_code == 200
    assert completed.json["status"] == "completed"
    denied = client.patch(
        f"/api/v1/bookings/{booking_id}",
        json={"status": "cancelled"},
        headers=staff_headers,
    )
    assert denied.status_code == 403

    removed = client.delete(
        f"/api/v1/vendors/profile/me/staff/{membership_id}",
        headers=owner_headers,
    )
    assert removed.status_code == 204
    assert client.get("/api/v1/bookings", headers=staff_headers).json == []


def test_vendor_staff_invitation_is_email_bound_and_vendor_owner_only(client, app):
    owner_id, owner_token = create_vendor_user(app, "Invite Owner", "invite-owner@vendor.test")
    staff_id, staff_token = create_vendor_user(app, "Invite Staff", "invite-staff@vendor.test")
    wrong_id, wrong_token = create_vendor_user(app, "Wrong Staff", "wrong@vendor.test")
    with app.app_context():
        profile = VendorProfile(
            user_id=owner_id,
            business_name="Invite Studio",
            category="Photography",
            city="Jaipur",
            verification_status="verified",
        )
        db.session.add(profile)
        db.session.commit()
    invite = client.post(
        "/api/v1/vendors/profile/me/staff/invitations",
        json={"email": "invite-staff@vendor.test"},
        headers={"Authorization": f"Bearer {owner_token}"},
    )
    assert invite.status_code == 201
    mismatch = client.post(
        "/api/v1/vendors/staff/invitations/accept",
        json={"token": invite.json["acceptanceToken"]},
        headers={"Authorization": f"Bearer {wrong_token}"},
    )
    assert mismatch.status_code == 404
    accepted = client.post(
        "/api/v1/vendors/staff/invitations/accept",
        json={"token": invite.json["acceptanceToken"]},
        headers={"Authorization": f"Bearer {staff_token}"},
    )
    assert accepted.status_code == 200

    staff_headers = {"Authorization": f"Bearer {staff_token}"}
    forbidden = client.post(
        "/api/v1/vendors/profile/me/staff/invitations",
        json={"email": "anyone@vendor.test"},
        headers=staff_headers,
    )
    assert forbidden.status_code == 403
