from datetime import datetime, timedelta, timezone

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
    member_headers = {
        "Authorization": f"Bearer {accepted.json['session']['accessToken']}"
    }

    created_event = client.post(
        "/api/v1/events",
        json={"name": "Shared Wedding", "type": "Wedding", "date": "2027-12-10"},
        headers=auth_headers,
    )
    event_id = created_event.json["id"]
    member_events = client.get(
        "/api/v1/events",
        headers=member_headers,
    )
    assert [event["id"] for event in member_events.json] == [event_id]
    assert client.get(
        f"/api/v1/events/{event_id}",
        headers=member_headers,
    ).status_code == 200
    assert client.patch(
        f"/api/v1/events/{event_id}",
        json={"name": "Unauthorized edit"},
        headers=member_headers,
    ).status_code == 404
    assert client.post(
        f"/api/v1/events/{event_id}/guests",
        json={"name": "Guest"},
        headers=member_headers,
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
        headers=member_headers,
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


def test_planner_invitation_can_create_an_email_bound_account(
    client, app, auth_headers, family_user
):
    invitation = client.post(
        "/api/v1/workspace/invitations",
        json={
            "email": "new-planner@example.com",
            "role": "planner",
            "permissions": ["event.view", "event.create"],
        },
        headers=auth_headers,
    )
    assert invitation.status_code == 201
    accepted = client.post(
        "/api/v1/workspace/invitations/accept",
        json={
            "token": invitation.json["acceptanceToken"],
            "name": "New Planner",
            "password": "planner-password-123",
        },
    )
    assert accepted.status_code == 200
    assert accepted.json["session"]["activeRole"] == "wedding_planner"
    assert accepted.json["session"]["user"]["role"] == "planner"
    created_event = client.post(
        "/api/v1/events",
        json={"name": "Planner created", "type": "Wedding", "date": "2027-12-10"},
        headers={"Authorization": f"Bearer {accepted.json['session']['accessToken']}"},
    )
    assert created_event.status_code == 201
    with app.app_context():
        from app.models.event import Event

        assert db.session.get(Event, created_event.json["id"]).owner_id == family_user["id"]
    with app.app_context():
        from app.models.planner import PlannerAssignment, PlannerProfile

        assert db.session.scalar(
            db.select(PlannerProfile.id).where(
                PlannerProfile.user_id == accepted.json["membership"]["userId"]
            )
        )
        assert db.session.scalar(
            db.select(PlannerAssignment.id).where(
                PlannerAssignment.membership_id == accepted.json["membership"]["id"]
            )
        )

    login = client.post(
        "/api/v1/auth/login",
        json={"email": "new-planner@example.com", "password": "planner-password-123"},
    )
    assert login.status_code == 200


def test_family_member_cannot_manage_workspace_members(client, app, auth_headers):
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
    assert response.status_code == 403
    forbidden = client.patch(
        f"/api/v1/workspace/members/{accepted.json['membership']['id']}",
        json={"permissions": ["event.view"]},
        headers={"Authorization": f"Bearer {member['token']}"},
    )
    assert forbidden.status_code == 403


def test_active_family_workspace_scopes_events_guests_and_planner_access(
    client, app, auth_headers, family_user, monkeypatch
):
    verification_codes = {}
    monkeypatch.setattr(
        "app.services.auth_service.send_verification_code",
        lambda email, code: verification_codes.__setitem__(email, code),
    )
    family_registration = {
        "name": "Second Family",
        "email": "second-family@example.com",
        "password": "family-password-123",
        "workspaceName": "Second Family Workspace",
    }
    assert client.post(
        "/api/v1/auth/register/family", json=family_registration
    ).status_code == 201
    verified = client.post(
        "/api/v1/auth/verify-otp",
        json={
            "email": family_registration["email"],
            "code": verification_codes[family_registration["email"]],
        },
    )
    assert verified.status_code == 200
    family_b_login = client.post(
        "/api/v1/auth/login",
        json={
            "email": family_registration["email"],
            "password": family_registration["password"],
        },
    )
    assert family_b_login.status_code == 200

    event_a = client.post(
        "/api/v1/events",
        json={"name": "Family A Wedding", "type": "Wedding", "date": "2027-12-10"},
        headers=auth_headers,
    )
    event_b = client.post(
        "/api/v1/events",
        json={"name": "Family B Wedding", "type": "Wedding", "date": "2027-12-11"},
        headers={
            "Authorization": f"Bearer {family_b_login.json['accessToken']}"
        },
    )
    assert event_a.status_code == event_b.status_code == 201
    guest_a = client.post(
        f"/api/v1/events/{event_a.json['id']}/guests",
        json={"name": "Family A Guest"},
        headers=auth_headers,
    )
    guest_b = client.post(
        f"/api/v1/events/{event_b.json['id']}/guests",
        json={"name": "Family B Guest"},
        headers={
            "Authorization": f"Bearer {family_b_login.json['accessToken']}"
        },
    )
    assert guest_a.status_code == guest_b.status_code == 201

    family_invitation = client.post(
        "/api/v1/workspace/invitations",
        json={
            "email": family_registration["email"],
            "role": "member",
            "permissions": ["event.view", "guest.view"],
        },
        headers=auth_headers,
    )
    assert family_invitation.status_code == 201
    family_acceptance = client.post(
        "/api/v1/workspace/invitations/accept",
        json={"token": family_invitation.json["acceptanceToken"]},
        headers={
            "Authorization": f"Bearer {family_b_login.json['accessToken']}"
        },
    )
    assert family_acceptance.status_code == 200
    family_a_headers = {
        "Authorization": f"Bearer {family_acceptance.json['session']['accessToken']}"
    }
    member_dashboard = client.get("/api/v1/dashboard", headers=family_a_headers)
    assert member_dashboard.status_code == 200
    assert member_dashboard.json["metrics"]["totalEvents"] == 1
    family_events = client.get("/api/v1/events", headers=family_a_headers)
    assert [item["id"] for item in family_events.json] == [event_a.json["id"]]
    assert client.get(
        f"/api/v1/events/{event_b.json['id']}/guests",
        headers=family_a_headers,
    ).status_code == 404
    dashboard = client.get("/api/v1/dashboard", headers=family_a_headers)
    assert dashboard.status_code == 200
    assert dashboard.json["metrics"]["totalEvents"] == 1
    assert [item["title"] for item in dashboard.json["recentActivities"]] == [
        "Family A Wedding"
    ]

    owner_membership_id = next(
        item["id"]
        for item in family_acceptance.json["session"]["memberships"]
        if item["role"] == "family_owner"
    )
    switched_back = client.post(
        "/api/v1/auth/switch-membership",
        json={"membershipId": owner_membership_id},
        headers={
            **family_a_headers,
            "X-CSRF-Token": client.get_cookie("utsav_csrf").value,
        },
    )
    assert switched_back.status_code == 200
    family_b_headers = {
        "Authorization": f"Bearer {switched_back.json['accessToken']}"
    }
    assert [
        item["id"]
        for item in client.get("/api/v1/events", headers=family_b_headers).json
    ] == [event_b.json["id"]]

    planner_registration = {
        "name": "Assigned Planner",
        "email": "assigned-planner@example.com",
        "password": "planner-password-123",
    }
    assert client.post(
        "/api/v1/auth/register/planner", json=planner_registration
    ).status_code == 201
    planner_verified = client.post(
        "/api/v1/auth/verify-otp",
        json={
            "email": planner_registration["email"],
            "code": verification_codes[planner_registration["email"]],
        },
    )
    assert planner_verified.status_code == 200
    planner_invitation = client.post(
        "/api/v1/workspace/invitations",
        json={
            "email": planner_registration["email"],
            "role": "planner",
            "permissions": ["event.view"],
        },
        headers=auth_headers,
    )
    planner_login = client.post(
        "/api/v1/auth/login",
        json={
            "email": planner_registration["email"],
            "password": planner_registration["password"],
        },
    )
    planner_acceptance = client.post(
        "/api/v1/workspace/invitations/accept",
        json={"token": planner_invitation.json["acceptanceToken"]},
        headers={
            "Authorization": f"Bearer {planner_login.json['accessToken']}"
        },
    )
    assert planner_acceptance.status_code == 200
    assert planner_acceptance.json["session"]["activeRole"] == "wedding_planner"
    planner_headers = {
        "Authorization": f"Bearer {planner_acceptance.json['session']['accessToken']}"
    }
    planner_dashboard = client.get("/api/v1/dashboard", headers=planner_headers)
    assert planner_dashboard.status_code == 200
    assert planner_dashboard.json["metrics"]["totalEvents"] == 1
    planner_events = client.get("/api/v1/events", headers=planner_headers)
    assert [item["id"] for item in planner_events.json] == [event_a.json["id"]]
    assert client.get(
        f"/api/v1/events/{event_b.json['id']}", headers=planner_headers
    ).status_code == 404


def test_family_workspace_invitations_expire_and_can_be_revoked(
    client, app, auth_headers
):
    from app.models.workspace import FamilyWorkspaceInvitation

    revoked = client.post(
        "/api/v1/workspace/invitations",
        json={
            "email": "revoke-family@example.com",
            "role": "member",
            "permissions": ["event.view"],
        },
        headers=auth_headers,
    )
    assert revoked.status_code == 201
    assert client.delete(
        f"/api/v1/workspace/invitations/{revoked.json['id']}",
        headers=auth_headers,
    ).status_code == 204
    assert client.post(
        "/api/v1/workspace/invitations/accept",
        json={"token": revoked.json["acceptanceToken"]},
    ).status_code == 404

    expired = client.post(
        "/api/v1/workspace/invitations",
        json={
            "email": "expired-family@example.com",
            "role": "member",
            "permissions": ["event.view"],
        },
        headers=auth_headers,
    )
    with app.app_context():
        invitation = db.session.get(FamilyWorkspaceInvitation, expired.json["id"])
        invitation.expires_at = datetime.now(timezone.utc) - timedelta(minutes=1)
        db.session.commit()
    response = client.post(
        "/api/v1/workspace/invitations/accept",
        json={"token": expired.json["acceptanceToken"]},
    )
    assert response.status_code == 410
    with app.app_context():
        assert db.session.get(FamilyWorkspaceInvitation, expired.json["id"]).status == "expired"


def test_removed_membership_invalidates_the_active_session(client, auth_headers):
    invitation = client.post(
        "/api/v1/workspace/invitations",
        json={
            "email": "removed-member@example.com",
            "role": "member",
            "permissions": ["event.view"],
        },
        headers=auth_headers,
    )
    accepted = client.post(
        "/api/v1/workspace/invitations/accept",
        json={
            "token": invitation.json["acceptanceToken"],
            "name": "Removed Member",
            "password": "removed-password-123",
        },
    )
    assert accepted.status_code == 200
    member_headers = {
        "Authorization": f"Bearer {accepted.json['session']['accessToken']}"
    }
    owner_membership_id = accepted.json["membership"]["id"]
    assert client.delete(
        f"/api/v1/workspace/members/{owner_membership_id}",
        headers=auth_headers,
    ).status_code == 204
    assert client.get("/api/v1/auth/me", headers=member_headers).status_code == 401
    assert client.get("/api/v1/events", headers=member_headers).json == []
