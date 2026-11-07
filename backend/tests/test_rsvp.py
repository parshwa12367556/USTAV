from datetime import datetime, timedelta, timezone

from app.extensions import db
from app.models.guest import Guest
from app.models.rsvp import RSVP


def test_guest_can_submit_public_rsvp(client, auth_headers):
    event_response = client.post(
        "/api/v1/events",
        json={"name": "RSVP Wedding", "type": "Wedding", "date": "2027-05-01"},
        headers=auth_headers,
    )
    event_id = event_response.json["id"]
    guest_response = client.post(
        f"/api/v1/events/{event_id}/guests",
        json={"name": "Guest Example", "email": "guest@example.com"},
        headers=auth_headers,
    )
    token = guest_response.json["invitationToken"]

    invitation = client.get(f"/api/v1/rsvp/{token}")
    assert invitation.status_code == 200
    assert invitation.json["guestName"] == "Guest Example"

    result = client.post(
        "/api/v1/rsvp",
        json={"invitationToken": token, "status": "attending", "plusOnes": 1},
    )
    assert result.status_code == 200

    guest = client.get(f"/api/v1/events/{event_id}/guests", headers=auth_headers).json[0]
    assert guest["rsvpStatus"] == "attending"
    assert guest["plusOnes"] == 1


def test_invalid_public_rsvp_token_is_rejected(client):
    response = client.post(
        "/api/v1/rsvp",
        json={"invitationToken": "invalid-token-123456", "status": "attending"},
    )
    assert response.status_code == 404


def test_guest_invitation_token_expires_and_can_be_revoked(client, auth_headers, app):
    event = client.post(
        "/api/v1/events",
        json={"name": "Token Wedding", "type": "Wedding", "date": "2027-05-01"},
        headers=auth_headers,
    ).json
    guest = client.post(
        f"/api/v1/events/{event['id']}/guests",
        json={"name": "Token Guest"},
        headers=auth_headers,
    ).json
    old_token = guest["invitationToken"]
    rotated = client.post(
        f"/api/v1/guests/{guest['id']}/invitation-token/rotate",
        headers=auth_headers,
    )
    assert rotated.status_code == 200
    assert rotated.json["invitationToken"] != old_token
    assert client.get(f"/api/v1/rsvp/{old_token}").status_code == 404
    assert client.get(f"/api/v1/rsvp/{rotated.json['invitationToken']}").status_code == 200

    with app.app_context():
        record = db.session.get(Guest, guest["id"])
        record.invitation_expires_at = datetime.now(timezone.utc) - timedelta(seconds=1)
        db.session.commit()
    expired_token = rotated.json["invitationToken"]
    assert client.get(f"/api/v1/rsvp/{expired_token}").status_code == 410
    assert client.post(
        "/api/v1/rsvp",
        json={"invitationToken": expired_token, "status": "attending"},
    ).status_code == 410


def test_guest_can_respond_maybe(client, auth_headers):
    event = client.post(
        "/api/v1/events",
        json={"name": "Maybe Wedding", "type": "Wedding", "date": "2027-05-01"},
        headers=auth_headers,
    ).json
    guest = client.post(
        f"/api/v1/events/{event['id']}/guests",
        json={"name": "Maybe Guest"},
        headers=auth_headers,
    ).json
    response = client.post(
        "/api/v1/rsvp",
        json={"invitationToken": guest["invitationToken"], "status": "maybe"},
    )
    assert response.status_code == 200
    assert client.get(
        f"/api/v1/rsvp/{guest['invitationToken']}"
    ).json["status"] == "maybe"


def test_guest_can_be_assigned_functions_and_rsvp_per_function(client, auth_headers, app):
    event = client.post(
        "/api/v1/events",
        json={"name": "Function Wedding", "type": "Wedding", "date": "2027-05-01"},
        headers=auth_headers,
    ).json
    haldi = client.post(
        f"/api/v1/events/{event['id']}/functions",
        json={"name": "Haldi", "date": "2027-04-30"},
        headers=auth_headers,
    ).json
    wedding = client.post(
        f"/api/v1/events/{event['id']}/functions",
        json={"name": "Wedding", "date": "2027-05-01"},
        headers=auth_headers,
    ).json
    guest = client.post(
        f"/api/v1/events/{event['id']}/guests",
        json={"name": "Function Guest"},
        headers=auth_headers,
    ).json

    assigned = client.put(
        f"/api/v1/guests/{guest['id']}/functions",
        json={"functionIds": [haldi["id"], wedding["id"]]},
        headers=auth_headers,
    )
    assert assigned.status_code == 200
    assert set(assigned.json["functionIds"]) == {haldi["id"], wedding["id"]}

    invitation = client.get(f"/api/v1/rsvp/{guest['invitationToken']}")
    assert invitation.status_code == 200
    assert {item["id"] for item in invitation.json["functions"]} == {haldi["id"], wedding["id"]}

    response = client.post(
        "/api/v1/rsvp",
        json={
            "invitationToken": guest["invitationToken"],
            "status": "attending",
            "functionIds": [haldi["id"]],
        },
    )
    assert response.status_code == 200

    with app.app_context():
        responses = db.session.scalars(
            db.select(RSVP).where(RSVP.guest_id == guest["id"])
        ).all()
        assert [(item.function_id, item.status) for item in responses] == [(haldi["id"], "attending")]

    updated_invitation = client.get(f"/api/v1/rsvp/{guest['invitationToken']}")
    statuses = {item["id"]: item["status"] for item in updated_invitation.json["functions"]}
    assert statuses == {haldi["id"]: "attending", wedding["id"]: "pending"}


def test_guest_cannot_rsvp_to_unassigned_or_other_event_function(client, auth_headers):
    first_event = client.post(
        "/api/v1/events",
        json={"name": "First Wedding", "type": "Wedding", "date": "2027-05-01"},
        headers=auth_headers,
    ).json
    second_event = client.post(
        "/api/v1/events",
        json={"name": "Second Wedding", "type": "Wedding", "date": "2027-06-01"},
        headers=auth_headers,
    ).json
    function = client.post(
        f"/api/v1/events/{second_event['id']}/functions",
        json={"name": "Reception", "date": "2027-06-01"},
        headers=auth_headers,
    ).json
    guest = client.post(
        f"/api/v1/events/{first_event['id']}/guests",
        json={"name": "Function Guest"},
        headers=auth_headers,
    ).json

    response = client.post(
        "/api/v1/rsvp",
        json={
            "invitationToken": guest["invitationToken"],
            "status": "attending",
            "functionIds": [function["id"]],
        },
    )
    assert response.status_code == 400

    assignment = client.put(
        f"/api/v1/guests/{guest['id']}/functions",
        json={"functionIds": [function["id"]]},
        headers=auth_headers,
    )
    assert assignment.status_code == 400
