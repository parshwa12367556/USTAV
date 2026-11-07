from flask_jwt_extended import create_access_token
from werkzeug.security import generate_password_hash

from app.extensions import db
from app.models.user import User


def create_family_member(app, email):
    with app.app_context():
        user = User(
            name="Invited Family Member",
            email=email,
            password_hash=generate_password_hash("member-password-123"),
            role="family",
            is_verified=True,
        )
        db.session.add(user)
        db.session.commit()
        token = create_access_token(user.id, additional_claims={"role": "family"})
        return {"id": user.id, "token": token}


def test_family_workspace_invitation_enforces_scoped_permissions(
    client, app, auth_headers, family_user
):
    member = create_family_member(app, "member@example.com")
    invitation = client.post(
        "/api/v1/workspace/invitations",
        json={
            "email": "member@example.com",
            "role": "member",
            "permissions": ["event.view", "guest.view"],
        },
        headers=auth_headers,
    )
    assert invitation.status_code == 201
    accepted = client.post(
        "/api/v1/workspace/invitations/accept",
        json={"token": invitation.json["acceptanceToken"]},
        headers={"Authorization": f"Bearer {member['token']}"},
    )
    assert accepted.status_code == 200
    assert accepted.json["membership"]["role"] == "member"

    created_event = client.post(
        "/api/v1/events",
        json={"name": "Shared Wedding", "type": "Wedding", "date": "2027-12-10"},
        headers=auth_headers,
    )
    event_id = created_event.json["id"]
    member_events = client.get(
        "/api/v1/events",
        headers={"Authorization": f"Bearer {member['token']}"},
    )
    assert [event["id"] for event in member_events.json] == [event_id]
    assert client.get(
        f"/api/v1/events/{event_id}",
        headers={"Authorization": f"Bearer {member['token']}"},
    ).status_code == 200
    assert client.patch(
        f"/api/v1/events/{event_id}",
        json={"name": "Unauthorized edit"},
        headers={"Authorization": f"Bearer {member['token']}"},
    ).status_code == 404
    assert client.post(
        f"/api/v1/events/{event_id}/guests",
        json={"name": "Guest"},
        headers={"Authorization": f"Bearer {member['token']}"},
    ).status_code == 404

    with app.app_context():
        from app.models.workspace import FamilyMembership

        membership = db.session.scalar(
            db.select(FamilyMembership).where(FamilyMembership.user_id == member["id"])
        )
        membership_id = membership.id
    updated = client.patch(
        f"/api/v1/workspace/members/{membership_id}",
        json={"permissions": ["event.view", "guest.view", "guest.create"]},
        headers=auth_headers,
    )
    assert updated.status_code == 200
    assert client.post(
        f"/api/v1/events/{event_id}/guests",
        json={"name": "Permitted Guest"},
        headers={"Authorization": f"Bearer {member['token']}"},
    ).status_code == 201


def test_family_invitation_is_bound_to_email_and_owner(client, app, auth_headers):
    invited = create_family_member(app, "bound@example.com")
    wrong_user = create_family_member(app, "not-bound@example.com")
    invitation = client.post(
        "/api/v1/workspace/invitations",
        json={
            "email": "bound@example.com",
            "role": "planner",
            "permissions": ["event.view"],
        },
        headers=auth_headers,
    )
    assert invitation.status_code == 201
    mismatch = client.post(
        "/api/v1/workspace/invitations/accept",
        json={"token": invitation.json["acceptanceToken"]},
        headers={"Authorization": f"Bearer {wrong_user['token']}"},
    )
    assert mismatch.status_code == 404
    accepted = client.post(
        "/api/v1/workspace/invitations/accept",
        json={"token": invitation.json["acceptanceToken"]},
        headers={"Authorization": f"Bearer {invited['token']}"},
    )
    assert accepted.status_code == 200
    assert accepted.json["membership"]["role"] == "planner"


def test_family_member_cannot_manage_other_workspace_members(client, app, auth_headers):
    member = create_family_member(app, "limited@example.com")
    invitation = client.post(
        "/api/v1/workspace/invitations",
        json={
            "email": "limited@example.com",
            "role": "member",
            "permissions": ["event.view"],
        },
        headers=auth_headers,
    )
    accepted = client.post(
        "/api/v1/workspace/invitations/accept",
        json={"token": invitation.json["acceptanceToken"]},
        headers={"Authorization": f"Bearer {member['token']}"},
    )
    response = client.get(
        "/api/v1/workspace/members",
        headers={"Authorization": f"Bearer {member['token']}"},
    )
    assert response.status_code == 200
    assert all(item["userId"] == member["id"] for item in response.json)
    forbidden = client.patch(
        f"/api/v1/workspace/members/{accepted.json['membership']['id']}",
        json={"permissions": ["event.view"]},
        headers={"Authorization": f"Bearer {member['token']}"},
    )
    assert forbidden.status_code == 404
