def test_event_crud_is_scoped_to_authenticated_owner(client, auth_headers):
    payload = {
        "name": "Aarav and Meera Wedding",
        "type": "Wedding",
        "date": "2027-01-15",
        "location": "Jaipur",
        "guestCount": 120,
        "budget": 850000,
    }
    created = client.post("/api/v1/events", json=payload, headers=auth_headers)
    assert created.status_code == 201
    event_id = created.json["id"]
    assert created.json["guestCount"] == 120

    listing = client.get("/api/v1/events", headers=auth_headers)
    assert [event["id"] for event in listing.json] == [event_id]

    updated = client.patch(
        f"/api/v1/events/{event_id}",
        json={"status": "confirmed"},
        headers=auth_headers,
    )
    assert updated.status_code == 200
    assert updated.json["status"] == "confirmed"

    deleted = client.delete(f"/api/v1/events/{event_id}", headers=auth_headers)
    assert deleted.status_code == 204
    assert client.get("/api/v1/events", headers=auth_headers).json == []


def test_event_creation_requires_authentication(client):
    response = client.post(
        "/api/v1/events",
        json={"name": "Private event", "type": "Wedding", "date": "2027-01-15"},
    )
    assert response.status_code == 401


def test_event_rejects_end_date_before_start(client, auth_headers):
    response = client.post(
        "/api/v1/events",
        json={
            "name": "Invalid event",
            "type": "Wedding",
            "date": "2027-01-15",
            "endDate": "2027-01-14",
        },
        headers=auth_headers,
    )
    assert response.status_code == 400


def test_event_functions_support_owner_scoped_crud(client, auth_headers):
    event = client.post(
        "/api/v1/events",
        json={"name": "Function Wedding", "type": "Wedding", "date": "2027-08-15"},
        headers=auth_headers,
    ).json
    created = client.post(
        f"/api/v1/events/{event['id']}/functions",
        json={
            "name": "Mehendi",
            "date": "2027-08-14",
            "venue": "Garden",
            "guestCount": 60,
            "notes": "Outdoor setup",
        },
        headers=auth_headers,
    )
    assert created.status_code == 201
    function_id = created.json["id"]
    assert len(client.get(f"/api/v1/events/{event['id']}/functions", headers=auth_headers).json) == 1

    updated = client.patch(
        f"/api/v1/functions/{function_id}",
        json={"guestCount": 75, "notes": "Add extra seating"},
        headers=auth_headers,
    )
    assert updated.status_code == 200
    assert updated.json["guestCount"] == 75

    assert client.delete(f"/api/v1/functions/{function_id}", headers=auth_headers).status_code == 204
    assert client.get(f"/api/v1/events/{event['id']}/functions", headers=auth_headers).json == []


def test_event_function_is_hidden_from_another_owner(client, auth_headers, app):
    event = client.post(
        "/api/v1/events",
        json={"name": "Private Wedding", "type": "Wedding", "date": "2027-08-15"},
        headers=auth_headers,
    ).json
    function = client.post(
        f"/api/v1/events/{event['id']}/functions",
        json={"name": "Haldi", "date": "2027-08-14"},
        headers=auth_headers,
    ).json
    with app.app_context():
        from flask_jwt_extended import create_access_token
        from werkzeug.security import generate_password_hash

        from app.extensions import db
        from app.models.user import User

        other = User(
            name="Other Family",
            email="other-family@example.com",
            password_hash=generate_password_hash("test-password-123"),
            role="family",
            is_verified=True,
        )
        db.session.add(other)
        db.session.commit()
        token = create_access_token(other.id, additional_claims={"role": "family"})
    other_headers = {"Authorization": f"Bearer {token}"}
    assert client.patch(
        f"/api/v1/functions/{function['id']}",
        json={"name": "Changed"},
        headers=other_headers,
    ).status_code == 404
    assert client.delete(
        f"/api/v1/functions/{function['id']}",
        headers=other_headers,
    ).status_code == 404
