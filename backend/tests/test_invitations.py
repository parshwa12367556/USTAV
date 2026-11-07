from app.extensions import db
from app.models.invitation import InvitationTemplate


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

    public = client.get(f"/api/v1/invitations/public/{created.json['shareToken']}")
    assert public.status_code == 200
    assert public.json["title"] == "Aarav and Meera"
    assert public.json["event"]["name"] == "Garden Wedding"

    unpublished = client.patch(
        f"/api/v1/invitations/{created.json['id']}",
        json={"status": "draft"},
        headers=auth_headers,
    )
    assert unpublished.status_code == 200
    assert client.get(f"/api/v1/invitations/public/{created.json['shareToken']}").status_code == 404
    republished = client.patch(
        f"/api/v1/invitations/{created.json['id']}",
        json={"status": "published"},
        headers=auth_headers,
    )
    assert republished.status_code == 200
    assert republished.json["shareToken"] != created.json["shareToken"]
    assert client.get(
        f"/api/v1/invitations/public/{republished.json['shareToken']}"
    ).status_code == 200


def test_invitation_creation_rejects_another_users_event(client, auth_headers):
    response = client.post(
        "/api/v1/invitations",
        json={"eventId": "not-owned", "templateId": "template", "title": "Invite"},
        headers=auth_headers,
    )
    assert response.status_code == 404


def test_unpublished_invitation_is_not_public(client):
    response = client.get("/api/v1/invitations/public/nonexistent-token")
    assert response.status_code == 404
