from flask_jwt_extended import create_access_token
from werkzeug.security import generate_password_hash

from app.extensions import db
from app.models.user import User
from app.models.vendor import VendorProfile


def create_verified_vendor(app):
    with app.app_context():
        user = User(
            name="Verified Vendor",
            email="vendor@example.com",
            password_hash=generate_password_hash("vendor-password-123"),
            role="vendor",
            is_verified=True,
        )
        db.session.add(user)
        db.session.flush()
        profile = VendorProfile(
            user_id=user.id,
            business_name="Garden Venue",
            category="Venue",
            city="Jaipur",
            verification_status="verified",
        )
        db.session.add(profile)
        db.session.commit()
        return user.id, profile.id


def test_quotation_lifecycle_and_amounts(client, auth_headers, app):
    event = client.post(
        "/api/v1/events",
        json={"name": "Quotation Wedding", "type": "Wedding", "date": "2027-07-12"},
        headers=auth_headers,
    ).json
    vendor_user_id, vendor_id = create_verified_vendor(app)

    created = client.post(
        "/api/v1/quotations",
        json={
            "eventId": event["id"],
            "vendorId": vendor_id,
            "title": "Venue and catering",
            "items": [{"description": "Garden hire", "quantity": 2, "unitPrice": 1500}],
        },
        headers=auth_headers,
    )
    assert created.status_code == 201
    assert created.json["status"] == "draft"
    assert created.json["total"] == 3000

    with app.app_context():
        vendor_token = create_access_token(
            identity=vendor_user_id,
            additional_claims={"role": "vendor"},
        )
    vendor_headers = {"Authorization": f"Bearer {vendor_token}"}
    missing_items = client.patch(
        f"/api/v1/quotations/{created.json['id']}",
        json={"status": "sent"},
        headers=vendor_headers,
    )
    assert missing_items.status_code == 400

    sent = client.patch(
        f"/api/v1/quotations/{created.json['id']}",
        json={
            "status": "sent",
            "title": "Garden hire proposal",
            "validUntil": "2027-06-30",
            "items": [{"description": "Garden hire", "quantity": 2, "unitPrice": 1750}],
        },
        headers=vendor_headers,
    )
    assert sent.status_code == 200
    assert sent.json["total"] == 3500
    assert sent.json["title"] == "Garden hire proposal"

    accepted = client.patch(
        f"/api/v1/quotations/{created.json['id']}",
        json={"status": "accepted"},
        headers=auth_headers,
    )
    assert accepted.status_code == 200
    assert accepted.json["status"] == "accepted"


def test_quotation_rejects_unverified_vendor(client, auth_headers, app):
    event = client.post(
        "/api/v1/events",
        json={"name": "Quotation Wedding", "type": "Wedding", "date": "2027-07-12"},
        headers=auth_headers,
    ).json
    with app.app_context():
        user = User(
            name="Pending Vendor",
            email="pending-vendor@example.com",
            password_hash=generate_password_hash("vendor-password-123"),
            role="vendor",
            is_verified=True,
        )
        db.session.add(user)
        db.session.flush()
        profile = VendorProfile(
            user_id=user.id,
            business_name="Pending Venue",
            category="Venue",
            city="Jaipur",
            verification_status="pending",
        )
        db.session.add(profile)
        db.session.commit()
        vendor_id = profile.id

    response = client.post(
        "/api/v1/quotations",
        json={"eventId": event["id"], "vendorId": vendor_id, "title": "Venue quote"},
        headers=auth_headers,
    )
    assert response.status_code == 404
