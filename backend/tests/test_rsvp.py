from datetime import datetime, timedelta, timezone

from app.extensions import db
from app.models.guest import Guest


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
