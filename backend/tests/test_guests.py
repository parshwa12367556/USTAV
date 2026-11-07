from io import BytesIO


def test_guest_creation_and_csv_import(client, auth_headers):
    event_response = client.post(
        "/api/v1/events",
        json={"name": "Family Wedding", "type": "Wedding", "date": "2027-03-20"},
        headers=auth_headers,
    )
    event_id = event_response.json["id"]

    guest_response = client.post(
        f"/api/v1/events/{event_id}/guests",
        json={"name": "Ananya Sharma", "email": "ananya@example.com", "group": "Friends"},
        headers=auth_headers,
    )
    assert guest_response.status_code == 201
    assert guest_response.json["group"] == "Friends"
    assert guest_response.json["rsvpStatus"] == "pending"

    csv_response = client.post(
        f"/api/v1/events/{event_id}/guests/import-csv",
        data={"file": (BytesIO(b"Name,Email\nRohan Mehta,rohan@example.com\n"), "guests.csv")},
        headers=auth_headers,
        content_type="multipart/form-data",
    )
    assert csv_response.status_code == 201
    assert csv_response.json["imported"] == 1
    assert len(client.get(f"/api/v1/events/{event_id}/guests", headers=auth_headers).json) == 2


def test_guest_routes_hide_other_users_events(client, auth_headers):
    response = client.get("/api/v1/events/not-owned/guests", headers=auth_headers)
    assert response.status_code == 404


def test_guest_groups_are_event_scoped_and_deletion_keeps_guests(client, auth_headers):
    event = client.post(
        "/api/v1/events",
        json={"name": "Group Wedding", "type": "Wedding", "date": "2027-03-20"},
        headers=auth_headers,
    ).json
    event_id = event["id"]
    created = client.post(
        f"/api/v1/events/{event_id}/guest-groups",
        json={"name": "Bride's family"},
        headers=auth_headers,
    )
    assert created.status_code == 201
    group_id = created.json["id"]
    duplicate = client.post(
        f"/api/v1/events/{event_id}/guest-groups",
        json={"name": " bride's FAMILY "},
        headers=auth_headers,
    )
    assert duplicate.status_code == 409

    guest = client.post(
        f"/api/v1/events/{event_id}/guests",
        json={"name": "Ananya Sharma", "group": "Bride's family"},
        headers=auth_headers,
    )
    assert guest.status_code == 201
    listed = client.get(f"/api/v1/events/{event_id}/guest-groups", headers=auth_headers)
    assert listed.json[0]["guestCount"] == 1

    updated = client.patch(
        f"/api/v1/guest-groups/{group_id}",
        json={"name": "Bride's relatives"},
        headers=auth_headers,
    )
    assert updated.status_code == 200
    assert client.get(f"/api/v1/events/{event_id}/guests", headers=auth_headers).json[0]["group"] == "Bride's relatives"

    assert client.delete(f"/api/v1/guest-groups/{group_id}", headers=auth_headers).status_code == 204
    remaining_guests = client.get(f"/api/v1/events/{event_id}/guests", headers=auth_headers)
    assert len(remaining_guests.json) == 1
    assert remaining_guests.json[0]["group"] is None
