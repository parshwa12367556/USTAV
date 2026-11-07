from flask_jwt_extended import create_access_token
from werkzeug.security import generate_password_hash

from app.extensions import db
from app.models.user import User
from app.models.vendor import CateringMenu, VendorProfile


def create_caterer(app, email, status="verified"):
    with app.app_context():
        user = User(
            name="Catering Vendor",
            email=email,
            password_hash=generate_password_hash("vendor-password-123"),
            role="vendor",
            is_verified=True,
        )
        db.session.add(user)
        db.session.flush()
        profile = VendorProfile(
            user_id=user.id,
            business_name="Saffron Catering",
            category="Catering",
            city="Jaipur",
            verification_status=status,
        )
        db.session.add(profile)
        db.session.commit()
        token = create_access_token(identity=user.id, additional_claims={"role": "vendor"})
        return profile.id, {"Authorization": f"Bearer {token}"}


def test_vendor_can_create_and_publicly_list_catering_menu(client, app):
    vendor_id, headers = create_caterer(app, "caterer@example.com")
    created = client.post(
        f"/api/v1/vendors/{vendor_id}/menus",
        json={"name": "Rajasthani feast", "pricePerPlate": 1250, "description": "Seasonal dishes"},
        headers=headers,
    )
    assert created.status_code == 201
    assert created.json["pricePerPlate"] == 1250

    listed = client.get(f"/api/v1/vendors/{vendor_id}/menus")
    assert listed.status_code == 200
    assert listed.json[0]["name"] == "Rajasthani feast"


def test_unverified_caterer_and_other_vendor_cannot_expose_menu(client, app):
    vendor_id, _ = create_caterer(app, "pending-caterer@example.com", status="pending")
    assert client.get(f"/api/v1/vendors/{vendor_id}/menus").status_code == 404

    verified_id, _ = create_caterer(app, "verified-caterer@example.com")
    other_vendor_id, other_headers = create_caterer(app, "other-caterer@example.com")
    assert other_vendor_id != verified_id
    response = client.post(
        f"/api/v1/vendors/{verified_id}/menus",
        json={"name": "Unauthorized menu", "pricePerPlate": 1000},
        headers=other_headers,
    )
    assert response.status_code == 404


def test_catering_menu_rejects_invalid_price(client, app):
    vendor_id, headers = create_caterer(app, "price-caterer@example.com")
    response = client.post(
        f"/api/v1/vendors/{vendor_id}/menus",
        json={"name": "Invalid menu", "pricePerPlate": -1},
        headers=headers,
    )
    assert response.status_code == 400


def test_vendor_can_manage_services_packages_and_portfolio(client, app):
    vendor_id, headers = create_caterer(app, "profile-caterer@example.com")

    service = client.post(
        "/api/v1/vendors/profile/me/services",
        json={"name": "Full catering", "description": "On-site service", "price": 48000},
        headers=headers,
    )
    assert service.status_code == 201
    assert service.json["price"] == 48000
    updated_service = client.patch(
        f"/api/v1/vendors/services/{service.json['id']}",
        json={"price": 52000, "isActive": False},
        headers=headers,
    )
    assert updated_service.status_code == 200
    assert updated_service.json["isActive"] is False
    assert client.get("/api/v1/vendors/profile/me/services", headers=headers).json[0]["id"] == service.json["id"]
    assert client.delete(
        f"/api/v1/vendors/services/{service.json['id']}",
        headers=headers,
    ).status_code == 204

    package = client.post(
        "/api/v1/vendors/profile/me/packages",
        json={
            "name": "Royal package",
            "price": 100000,
            "inclusions": ["Buffet", "Dessert"],
        },
        headers=headers,
    )
    assert package.status_code == 201
    assert package.json["inclusions"] == ["Buffet", "Dessert"]
    assert client.patch(
        f"/api/v1/vendors/packages/{package.json['id']}",
        json={"price": 110000},
        headers=headers,
    ).json["price"] == 110000
    assert client.delete(
        f"/api/v1/vendors/packages/{package.json['id']}",
        headers=headers,
    ).status_code == 204

    portfolio = client.post(
        "/api/v1/vendors/profile/me/portfolio",
        json={"imageUrl": "https://example.test/portfolio.jpg", "caption": "Outdoor dinner"},
        headers=headers,
    )
    assert portfolio.status_code == 201
    assert client.get("/api/v1/vendors/profile/me/portfolio", headers=headers).json[0]["id"] == portfolio.json["id"]
    assert client.delete(
        f"/api/v1/vendors/portfolio/{portfolio.json['id']}",
        headers=headers,
    ).status_code == 204

    public = client.get(f"/api/v1/vendors/{vendor_id}")
    assert public.status_code == 200
    assert public.json["packages"] == []


def test_vendor_profile_changes_return_to_verification_queue(client, app):
    _, headers = create_caterer(app, "profile-review@example.com")
    response = client.patch(
        "/api/v1/vendors/profile/me",
        json={"description": "Family-owned catering with seasonal menus."},
        headers=headers,
    )
    assert response.status_code == 200
    assert response.json["verificationStatus"] == "pending"


def test_vendor_availability_is_upserted_per_date_and_owner_scoped(client, app):
    _, headers = create_caterer(app, "availability-caterer@example.com")
    first = client.put(
        "/api/v1/vendors/profile/me/availability",
        json={"date": "2027-12-18", "isAvailable": False, "note": "Already booked"},
        headers=headers,
    )
    assert first.status_code == 200
    second = client.put(
        "/api/v1/vendors/profile/me/availability",
        json={"date": "2027-12-18", "isAvailable": True},
        headers=headers,
    )
    assert second.status_code == 200
    assert second.json["id"] == first.json["id"]
    assert second.json["isAvailable"] is True
    assert client.get("/api/v1/vendors/profile/me/availability", headers=headers).json == [second.json]
    assert client.delete(
        f"/api/v1/vendors/profile/me/availability/{second.json['id']}",
        headers=headers,
    ).status_code == 204
    assert client.get("/api/v1/vendors/profile/me/availability", headers=headers).json == []
