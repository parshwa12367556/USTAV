from datetime import datetime, timedelta, timezone
from datetime import date
from decimal import Decimal

from flask_jwt_extended import create_access_token
from werkzeug.security import generate_password_hash

from app.extensions import db
from app.models.booking import Booking
from app.models.event import Event
from app.models.guest import Guest
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
        guest = Guest(event_id=event.id, name="Private family guest")
        db.session.add(guest)
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
        event_id = event.id
        vendor_id = vendor.id

    owner_headers = {"Authorization": f"Bearer {owner_token}"}
    staff_headers = {"Authorization": f"Bearer {staff_token}"}
    assert client.get(
        f"/api/v1/events/{event_id}/guests",
        headers=owner_headers,
    ).status_code == 404
    assert client.get(
        f"/api/v1/events/{event_id}/guests",
        headers=staff_headers,
    ).status_code == 404
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
    staff_session_headers = {
        "Authorization": f"Bearer {accepted.json['session']['accessToken']}"
    }
    membership_id = accepted.json["membership"]["id"]
    assigned = client.post(
        f"/api/v1/vendors/profile/me/bookings/{booking_id}/assignments",
        json={"membershipId": membership_id},
        headers=owner_headers,
    )
    assert assigned.status_code == 201

    staff_bookings = client.get("/api/v1/bookings", headers=staff_headers)
    assert [item["id"] for item in staff_bookings.json] == [booking_id]
    staff_dashboard = client.get("/api/v1/dashboard", headers=staff_session_headers)
    assert [item["id"] for item in staff_dashboard.json["recentBookings"]] == [booking_id]
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
    with app.app_context():
        from app.models.vendor_staff import VendorMembershipPermission

        view_permission = db.session.scalar(
            db.select(VendorMembershipPermission).where(
                VendorMembershipPermission.membership_id == membership_id,
                VendorMembershipPermission.permission == "booking.view",
            )
        )
        db.session.delete(view_permission)
        db.session.commit()
    staff_dashboard = client.get("/api/v1/dashboard", headers=staff_session_headers)
    assert staff_dashboard.status_code == 200
    assert staff_dashboard.json["recentBookings"] == []
    assert staff_dashboard.json["metrics"]["confirmedBookings"] == 0

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


def test_vendor_staff_invitation_creates_new_account(client, app):
    owner_id, owner_token = create_vendor_user(app, "Owner", "new-owner@vendor.test")
    with app.app_context():
        db.session.add(
            VendorProfile(
                user_id=owner_id,
                business_name="New Staff Studio",
                category="Photography",
                city="Jaipur",
            )
        )
        db.session.commit()
    invitation = client.post(
        "/api/v1/vendors/profile/me/staff/invitations",
        json={"email": "new-staff@vendor.test"},
        headers={"Authorization": f"Bearer {owner_token}"},
    )
    assert invitation.status_code == 201
    accepted = client.post(
        "/api/v1/vendors/staff/invitations/accept",
        json={
            "token": invitation.json["acceptanceToken"],
            "name": "New Team Member",
            "password": "staff-password-123",
        },
    )
    assert accepted.status_code == 200
    assert accepted.json["session"]["activeRole"] == "vendor_staff"
    staff_headers = {
        "Authorization": f"Bearer {accepted.json['session']['accessToken']}"
    }
    staff_dashboard = client.get("/api/v1/dashboard", headers=staff_headers)
    assert staff_dashboard.status_code == 200
    assert staff_dashboard.json["role"] == "vendor"
    assert client.post(
        "/api/v1/vendors/profile",
        json={
            "name": "Escalation Attempt",
            "category": "Photography",
            "city": "Jaipur",
        },
        headers={"Authorization": f"Bearer {accepted.json['session']['accessToken']}"},
    ).status_code == 403
    login = client.post(
        "/api/v1/auth/login",
        json={"email": "new-staff@vendor.test", "password": "staff-password-123"},
    )
    assert login.status_code == 200


def test_vendor_invitation_expiration_revocation_and_private_service_isolation(
    client, app
):
    from app.models.vendor import VendorProfile
    from app.models.vendor_staff import VendorStaffInvitation

    owner_a_id, owner_a_token = create_vendor_user(
        app, "Vendor A", "vendor-a@example.test"
    )
    owner_b_id, owner_b_token = create_vendor_user(
        app, "Vendor B", "vendor-b@example.test"
    )
    with app.app_context():
        profile_a = VendorProfile(
            user_id=owner_a_id,
            business_name="Vendor A Studio",
            category="Catering",
            city="Jaipur",
        )
        profile_b = VendorProfile(
            user_id=owner_b_id,
            business_name="Vendor B Studio",
            category="Photography",
            city="Udaipur",
        )
        db.session.add_all([profile_a, profile_b])
        db.session.commit()

    owner_a_headers = {"Authorization": f"Bearer {owner_a_token}"}
    owner_b_headers = {"Authorization": f"Bearer {owner_b_token}"}
    service_a = client.post(
        "/api/v1/vendors/profile/me/services",
        json={"name": "Private A service", "price": 1000},
        headers=owner_a_headers,
    )
    service_b = client.post(
        "/api/v1/vendors/profile/me/services",
        json={"name": "Private B service", "price": 2000},
        headers=owner_b_headers,
    )
    assert service_a.status_code == service_b.status_code == 201
    assert client.patch(
        f"/api/v1/vendors/services/{service_b.json['id']}",
        json={"name": "Unauthorized edit"},
        headers=owner_a_headers,
    ).status_code == 404
    assert client.get(
        "/api/v1/vendors/profile/me/services", headers=owner_a_headers
    ).json[0]["id"] == service_a.json["id"]
    assert client.get(
        "/api/v1/vendors/profile/me/services", headers=owner_b_headers
    ).json[0]["id"] == service_b.json["id"]

    revoked = client.post(
        "/api/v1/vendors/profile/me/staff/invitations",
        json={"email": "revoked-staff@example.test"},
        headers=owner_a_headers,
    )
    assert revoked.status_code == 201
    assert client.delete(
        f"/api/v1/vendors/profile/me/staff/invitations/{revoked.json['id']}",
        headers=owner_a_headers,
    ).status_code == 204
    assert client.post(
        "/api/v1/vendors/staff/invitations/accept",
        json={"token": revoked.json["acceptanceToken"]},
    ).status_code == 404

    expired = client.post(
        "/api/v1/vendors/profile/me/staff/invitations",
        json={"email": "expired-staff@example.test"},
        headers=owner_a_headers,
    )
    with app.app_context():
        invitation = db.session.get(VendorStaffInvitation, expired.json["id"])
        invitation.expires_at = datetime.now(timezone.utc) - timedelta(minutes=1)
        db.session.commit()
    response = client.post(
        "/api/v1/vendors/staff/invitations/accept",
        json={"token": expired.json["acceptanceToken"]},
    )
    assert response.status_code == 410
    with app.app_context():
        assert db.session.get(VendorStaffInvitation, expired.json["id"]).status == "expired"
