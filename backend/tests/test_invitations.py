from app.extensions import db
from app.models.invitation import InvitationTemplate
from app.models.invitation import UserInvitation


def test_published_invitation_can_be_viewed_publicly(client, auth_headers, app):
    event_response = client.post(
        "/api/v1/events",
        json={"name": "Garden Wedding", "type": "Wedding", "date": "2027-06-12"},
        headers=auth_headers,
    )
    with app.app_context():
        template = InvitationTemplate(name="Garden", category="Floral")
        db.session.add(template)
        db.session.commit()
        template_id = template.id

    created = client.post(
        "/api/v1/invitations",
        json={
            "eventId": event_response.json["id"],
            "templateId": template_id,
            "title": "Aarav and Meera",
            "status": "published",
            "design": {"message": "Join us"},
        },
        headers=auth_headers,
    )
    assert created.status_code == 201
    assert created.json["shareToken"]
    assert "shareTokenHash" not in created.json
    with app.app_context():
        invitation_record = db.session.get(UserInvitation, created.json["id"])
        assert invitation_record.share_token_hash
        assert invitation_record.share_token_hash != created.json["shareToken"]
        assert not hasattr(invitation_record, "share_token")

    public = client.post(
        "/api/v1/invitations/public/lookup",
        json={"token": created.json["shareToken"]},
    )
    assert public.status_code == 200
    assert public.json["title"] == "Aarav and Meera"
    assert public.json["event"]["name"] == "Garden Wedding"
    assert public.headers["Cache-Control"] == "no-store"

    listed = client.get("/api/v1/invitations", headers=auth_headers)
    assert "shareToken" not in listed.json[0]
    assert "share_token_hash" not in listed.json[0]
    unpublished = client.patch(
        f"/api/v1/invitations/{created.json['id']}",
        json={"status": "draft"},
        headers=auth_headers,
    )
    assert unpublished.status_code == 200
    assert client.post(
        "/api/v1/invitations/public/lookup",
        json={"token": created.json["shareToken"]},
    ).status_code == 404
    republished = client.patch(
        f"/api/v1/invitations/{created.json['id']}",
        json={"status": "published"},
        headers=auth_headers,
    )
    assert republished.status_code == 200
    assert republished.json["shareToken"] != created.json["shareToken"]
    assert client.post(
        "/api/v1/invitations/public/lookup",
        json={"token": republished.json["shareToken"]},
    ).status_code == 200

    revoked = client.post(
        f"/api/v1/invitations/{created.json['id']}/revoke",
        headers=auth_headers,
    )
    assert revoked.status_code == 200
    assert client.post(
        "/api/v1/invitations/public/lookup",
        json={"token": republished.json["shareToken"]},
    ).status_code == 404


def test_invitation_creation_rejects_another_users_event(client, auth_headers):
    response = client.post(
        "/api/v1/invitations",
        json={"eventId": "not-owned", "templateId": "template", "title": "Invite"},
        headers=auth_headers,
    )
    assert response.status_code == 404


def test_unpublished_invitation_is_not_public(client):
    response = client.post(
        "/api/v1/invitations/public/lookup",
        json={"token": "nonexistent-token-123456789012345"},
    )
    assert response.status_code == 404
