import base64
import hashlib
import hmac
import struct
import time

import pytest


def _totp_code(secret):
    key = base64.b32decode(secret + "=" * (-len(secret) % 8))
    counter = int(time.time()) // 30
    digest = hmac.new(key, struct.pack(">Q", counter), hashlib.sha1).digest()
    offset = digest[-1] & 15
    value = struct.unpack(">I", digest[offset:offset + 4])[0] & 0x7FFFFFFF
    return f"{value % 1_000_000:06d}"


def _csrf_headers(client, access_token=None):
    csrf_cookie = client.get_cookie("utsav_csrf")
    headers = {"X-CSRF-Token": csrf_cookie.value}
    if access_token:
        headers["Authorization"] = f"Bearer {access_token}"
    return headers


def test_registration_verification_and_login(client, monkeypatch):
    verification_codes = []
    monkeypatch.setattr(
        "app.services.auth_service.send_verification_code",
        lambda email, code: verification_codes.append((email, code)),
    )
    response = client.post(
        "/api/v1/auth/register",
        json={
            "name": "Test Family",
            "email": "family@example.com",
            "phone": "+919876543210",
            "password": "secure-password-123",
            "role": "family",
        },
    )
    assert response.status_code == 201
    assert response.json["verificationRequired"] is True
    assert "code" not in response.json
    assert verification_codes[0][0] == "family@example.com"

    verification = client.post(
        "/api/v1/auth/verify-otp",
        json={"email": "family@example.com", "code": verification_codes[0][1]},
    )
    assert verification.status_code == 200
    assert verification.json["user"]["email"] == "family@example.com"
    assert verification.json["accessToken"]
    assert "refreshToken" not in verification.json
    assert "HttpOnly" in verification.headers["Set-Cookie"]

    login = client.post(
        "/api/v1/auth/login",
        json={"email": "family@example.com", "password": "secure-password-123"},
    )
    assert login.status_code == 200
    assert login.json["user"]["role"] == "family"


def test_fixed_registration_code_works_only_in_debug_smtp_mode(client, app, monkeypatch):
    verification_codes = []
    monkeypatch.setattr(
        "app.services.auth_service.send_verification_code",
        lambda email, code: verification_codes.append(code),
    )
    app.config.update(DEBUG=True, OTP_DELIVERY_MODE="smtp", OTP_FIXED_CODE="987654")

    response = client.post(
        "/api/v1/auth/register",
        json={
            "name": "Fixed Code Family",
            "email": "fixed-code@example.com",
            "password": "secure-password-123",
        },
    )
    assert response.status_code == 201
    assert verification_codes == ["987654"]
    verification = client.post(
        "/api/v1/auth/verify-otp",
        json={"email": "fixed-code@example.com", "code": "987654"},
    )
    assert verification.status_code == 200

    app.config.update(DEBUG=False)
    with app.app_context():
        from app.services.auth_service import _generate_verification_code

        assert _generate_verification_code() != "987654"


def test_login_rejects_unverified_account(client):
    client.post(
        "/api/v1/auth/register",
        json={
            "name": "Unverified Family",
            "email": "unverified@example.com",
            "password": "secure-password-123",
        },
    )
    response = client.post(
        "/api/v1/auth/login",
        json={"email": "unverified@example.com", "password": "secure-password-123"},
    )
    assert response.status_code == 401
    assert response.json["message"] == "Email or password is incorrect."


def test_registration_rejects_duplicate_email(client):
    payload = {
        "name": "Test Family",
        "email": "duplicate@example.com",
        "password": "secure-password-123",
    }
    assert client.post("/api/v1/auth/register", json=payload).status_code == 201
    response = client.post("/api/v1/auth/register", json=payload)
    assert response.status_code == 409


def test_public_registration_cannot_create_admin_account(client):
    response = client.post(
        "/api/v1/auth/register",
        json={
            "name": "Admin Attempt",
            "email": "admin-attempt@example.com",
            "password": "secure-password-123",
            "role": "admin",
        },
    )
    assert response.status_code == 400


def test_role_specific_registration_creates_matching_workspaces(client, app, monkeypatch):
    from app.extensions import db
    from app.models.user import User

    verification_codes = {}
    monkeypatch.setattr(
        "app.services.auth_service.send_verification_code",
        lambda email, code: verification_codes.__setitem__(email, code),
    )
    registrations = [
        (
            "/api/v1/auth/register/family",
            {
                "name": "Family Owner",
                "email": "owner-role@example.com",
                "password": "secure-password-123",
                "workspaceName": "The Patel Celebration",
            },
            "family_owner",
        ),
        (
            "/api/v1/auth/register/vendor",
            {
                "name": "Vendor Owner",
                "email": "vendor-role@example.com",
                "password": "secure-password-123",
                "businessName": "Lotus Catering",
                "category": "Catering",
                "city": "Jaipur",
                "address": "12 Garden Road",
            },
            "vendor_owner",
        ),
        (
            "/api/v1/auth/register/planner",
            {
                "name": "Planner",
                "email": "planner-role@example.com",
                "password": "secure-password-123",
                "companyName": "Gather Well",
                "yearsExperience": 5,
            },
            "wedding_planner",
        ),
    ]
    for path, payload, expected_role in registrations:
        assert client.post(path, json=payload).status_code == 201
        verified = client.post(
            "/api/v1/auth/verify-otp",
            json={"email": payload["email"], "code": verification_codes[payload["email"]]},
        )
        assert verified.status_code == 200
        assert verified.json["activeRole"] == expected_role
        login = client.post(
            "/api/v1/auth/login",
            json={"email": payload["email"], "password": payload["password"]},
        )
        assert login.status_code == 200
        assert login.json["activeRole"] == expected_role
        assert login.json["memberships"][0]["role"] == expected_role
        authenticated_user = client.get(
            "/api/v1/auth/me",
            headers={"Authorization": f"Bearer {login.json['accessToken']}"},
        )
        assert authenticated_user.status_code == 200
        assert authenticated_user.json["user"]["id"] == login.json["user"]["id"]
        assert authenticated_user.json["membershipId"] == login.json["membershipId"]
        dashboard = client.get(
            "/api/v1/dashboard",
            headers={"Authorization": f"Bearer {login.json['accessToken']}"},
        )
        assert dashboard.status_code == 200
        assert dashboard.json["role"] == payload.get("role", {
            "family_owner": "family",
            "vendor_owner": "vendor",
            "wedding_planner": "planner",
        }[expected_role])

    with app.app_context():
        from app.models.planner import PlannerProfile
        from app.models.vendor import VendorProfile
        from app.models.vendor_staff import VendorMembership
        from app.models.workspace import FamilyMembership, FamilyWorkspace

        family_id = db.session.scalar(
            db.select(User.id).where(User.email == "owner-role@example.com")
        )
        vendor_user_id = db.session.scalar(
            db.select(User.id).where(User.email == "vendor-role@example.com")
        )
        planner_id = db.session.scalar(
            db.select(User.id).where(User.email == "planner-role@example.com")
        )
        assert db.session.get(User, family_id).role == "family"
        assert db.session.scalar(
            db.select(FamilyMembership.role).where(
                FamilyMembership.user_id == family_id
            )
        ) == "owner"
        assert db.session.scalar(
            db.select(FamilyWorkspace.name).where(
                FamilyWorkspace.owner_user_id == family_id
            )
        ) == "The Patel Celebration"
        assert db.session.get(User, vendor_user_id).role == "vendor"
        assert db.session.scalar(
            db.select(VendorProfile.business_name).where(
                VendorProfile.user_id == vendor_user_id
            )
        ) == "Lotus Catering"
        assert db.session.scalar(
            db.select(VendorMembership.role).where(
                VendorMembership.user_id == vendor_user_id
            )
        ) == "owner"
        assert db.session.get(User, planner_id).role == "planner"
        assert db.session.scalar(
            db.select(PlannerProfile.company_name).where(
                PlannerProfile.user_id == planner_id
            )
        ) == "Gather Well"


def test_super_admin_login_and_dashboard(client, app):
    from app.extensions import db
    from app.models.user import User
    from werkzeug.security import generate_password_hash

    with app.app_context():
        admin = User(
            name="Platform Administrator",
            email="platform-admin@example.com",
            password_hash=generate_password_hash("secure-password-123"),
            role="admin",
            is_verified=True,
        )
        db.session.add(admin)
        db.session.commit()

    admin_login = client.post(
        "/api/v1/auth/login",
        json={"email": "platform-admin@example.com", "password": "secure-password-123"},
    )
    assert admin_login.status_code == 200
    assert admin_login.json["mfaRequired"] is True
    challenge = admin_login.json["challengeToken"]
    blocked_dashboard = client.get(
        "/api/v1/dashboard",
        headers={"Authorization": f"Bearer {challenge}"},
    )
    assert blocked_dashboard.status_code == 401
    setup = client.post(
        "/api/v1/auth/2fa/setup",
        headers={"Authorization": f"Bearer {challenge}"},
    )
    assert setup.status_code == 200
    verified = client.post(
        "/api/v1/auth/2fa/verify",
        json={"code": _totp_code(setup.json["secret"])},
        headers={"Authorization": f"Bearer {challenge}"},
    )
    assert verified.status_code == 200
    assert len(verified.json["recoveryCodes"]) == 10
    admin_dashboard = client.get(
        "/api/v1/dashboard",
        headers={"Authorization": f"Bearer {verified.json['accessToken']}"},
    )
    assert admin_dashboard.status_code == 200
    assert admin_dashboard.json["role"] == "admin"

    recovery_code = verified.json["recoveryCodes"][0]
    client.post(
        "/api/v1/auth/logout",
        json={},
        headers=_csrf_headers(client, verified.json["accessToken"]),
    )
    second_login = client.post(
        "/api/v1/auth/login",
        json={"email": "platform-admin@example.com", "password": "secure-password-123"},
    )
    recovery_login = client.post(
        "/api/v1/auth/2fa/verify",
        json={"code": recovery_code},
        headers={"Authorization": f"Bearer {second_login.json['challengeToken']}"},
    )
    assert recovery_login.status_code == 200
    client.post(
        "/api/v1/auth/logout",
        json={},
        headers=_csrf_headers(client, recovery_login.json["accessToken"]),
    )
    third_login = client.post(
        "/api/v1/auth/login",
        json={"email": "platform-admin@example.com", "password": "secure-password-123"},
    )
    reused_code = client.post(
        "/api/v1/auth/2fa/verify",
        json={"code": recovery_code},
        headers={"Authorization": f"Bearer {third_login.json['challengeToken']}"},
    )
    assert reused_code.status_code == 401


def test_membership_switch_is_user_scoped_and_rotates_tokens(client, app, family_user):
    from app.extensions import db
    from app.models.user import User
    from app.models.vendor import VendorProfile
    from app.models.vendor_staff import VendorMembership

    with app.app_context():
        user = db.session.get(User, family_user["id"])
        profile = VendorProfile(
            user_id=user.id,
            business_name="Second workspace",
            category="Decor",
            city="Jaipur",
        )
        db.session.add(profile)
        db.session.flush()
        vendor_membership = VendorMembership(
            vendor_id=profile.id,
            user_id=user.id,
            role="owner",
            status="active",
        )
        db.session.add(vendor_membership)
        db.session.commit()
        vendor_membership_id = vendor_membership.id

    login = client.post(
        "/api/v1/auth/login",
        json={"email": family_user["email"], "password": "test-password-123"},
    )
    assert login.status_code == 200
    assert len(login.json["memberships"]) == 2
    headers = {"Authorization": f"Bearer {login.json['accessToken']}"}
    assert client.get("/api/v1/vendors/profile/me", headers=headers).status_code == 403
    switched = client.post(
        "/api/v1/auth/switch-membership",
        json={"membershipId": vendor_membership_id},
        headers=_csrf_headers(client, login.json["accessToken"]),
    )
    assert switched.status_code == 200
    assert switched.json["activeRole"] == "vendor_owner"
    assert "vendor.manage" in switched.json["permissions"]
    assert "event.view" not in switched.json["permissions"]
    assert switched.json["activeBusiness"]["name"] == "Second workspace"
    switched_headers = {
        "Authorization": f"Bearer {switched.json['accessToken']}"
    }
    assert client.get("/api/v1/vendors/profile/me", headers=switched_headers).status_code == 200
    assert client.get("/api/v1/events", headers=switched_headers).json == []
    assert client.get("/api/v1/workspace/members", headers=switched_headers).status_code == 403
    assert client.get("/api/v1/auth/me", headers=headers).status_code == 401
    restored = client.get(
        "/api/v1/auth/me",
        headers={"Authorization": f"Bearer {switched.json['accessToken']}"},
    )
    assert restored.status_code == 200
    assert restored.json["activeRole"] == "vendor_owner"


def test_current_user_endpoint_returns_authenticated_profile(client, auth_headers):
    response = client.get("/api/v1/auth/me", headers=auth_headers)
    assert response.status_code == 200
    assert response.json["user"]["email"] == "priya@example.com"

    anonymous = client.get("/api/v1/auth/me")
    assert anonymous.status_code == 401


def test_logout_revokes_access_and_refresh_tokens(client, family_user):
    login = client.post(
        "/api/v1/auth/login",
        json={"email": family_user["email"], "password": "test-password-123"},
    )
    access_token = login.json["accessToken"]
    headers = _csrf_headers(client, access_token)
    response = client.post("/api/v1/auth/logout", json={}, headers=headers)

    assert response.status_code == 200
    assert client.get("/api/v1/auth/me", headers=headers).status_code == 401
    assert client.get("/api/v1/events", headers=headers).status_code == 401
    assert client.post("/api/v1/auth/refresh", headers=headers).status_code in {401, 422}


def test_logout_ignores_client_supplied_refresh_token(client, family_user):
    login = client.post(
        "/api/v1/auth/login",
        json={"email": family_user["email"], "password": "test-password-123"},
    )
    access_token = login.json["accessToken"]
    response = client.post(
        "/api/v1/auth/logout",
        json={"refreshToken": "client-supplied-token"},
        headers=_csrf_headers(client, access_token),
    )
    assert response.status_code == 200
    assert client.get(
        "/api/v1/auth/me", headers={"Authorization": f"Bearer {access_token}"}
    ).status_code == 401


def test_refresh_rotates_and_revokes_the_previous_refresh_token(client, app, family_user):
    client.post(
        "/api/v1/auth/login",
        json={"email": family_user["email"], "password": "test-password-123"},
    )
    old_refresh_token = client.get_cookie("utsav_refresh", path="/api/v1/auth").value
    csrf_headers = _csrf_headers(client)
    refreshed = client.post("/api/v1/auth/refresh", headers=csrf_headers)
    assert refreshed.status_code == 200
    assert "refreshToken" not in refreshed.json
    assert client.get_cookie("utsav_refresh", path="/api/v1/auth").value != old_refresh_token
    client.set_cookie("utsav_refresh", old_refresh_token, path="/api/v1/auth")
    old_token_reuse = client.post("/api/v1/auth/refresh", headers=csrf_headers)
    assert old_token_reuse.status_code == 401


def test_login_session_survives_request_teardown(client, app, family_user):
    from app.extensions import db

    login = client.post(
        "/api/v1/auth/login",
        json={"email": family_user["email"], "password": "test-password-123"},
    )
    assert login.status_code == 200

    db.session.remove()

    authenticated = client.get(
        "/api/v1/auth/me",
        headers={"Authorization": f"Bearer {login.json['accessToken']}"},
    )
    assert authenticated.status_code == 200

    refreshed = client.post("/api/v1/auth/refresh", headers=_csrf_headers(client))
    assert refreshed.status_code == 200


def test_refresh_requires_csrf_and_trusted_origin(client, family_user):
    client.post(
        "/api/v1/auth/login",
        json={"email": family_user["email"], "password": "test-password-123"},
    )
    assert client.post("/api/v1/auth/refresh").status_code == 403
    valid_csrf = _csrf_headers(client)
    assert client.post(
        "/api/v1/auth/refresh",
        headers={**valid_csrf, "Origin": "https://attacker.example"},
    ).status_code == 403
    assert client.post("/api/v1/auth/refresh", headers=valid_csrf).status_code == 200


def test_password_reset_changes_password_and_consumes_code(client, family_user, monkeypatch):
    codes = []
    monkeypatch.setattr(
        "app.services.auth_service.send_verification_code",
        lambda email, code: codes.append((email, code)),
    )
    requested = client.post(
        "/api/v1/auth/password-reset/request",
        json={"email": "priya@example.com"},
    )
    assert requested.status_code == 200
    assert "code" not in requested.json
    assert codes[0][0] == "priya@example.com"

    reset = client.post(
        "/api/v1/auth/password-reset",
        json={
            "email": "priya@example.com",
            "code": codes[0][1],
            "newPassword": "new-secure-password-456",
        },
    )
    assert reset.status_code == 200
    login = client.post(
        "/api/v1/auth/login",
        json={"email": "priya@example.com", "password": "new-secure-password-456"},
    )
    assert login.status_code == 200

    reused_code = client.post(
        "/api/v1/auth/password-reset",
        json={
            "email": "priya@example.com",
            "code": codes[0][1],
            "newPassword": "another-secure-password-789",
        },
    )
    assert reused_code.status_code == 400


def test_password_reset_revokes_existing_sessions(client, family_user, monkeypatch):
    codes = []
    monkeypatch.setattr(
        "app.services.auth_service.send_verification_code",
        lambda email, code: codes.append(code),
    )
    login = client.post(
        "/api/v1/auth/login",
        json={"email": family_user["email"], "password": "test-password-123"},
    )
    old_access_token = login.json["accessToken"]
    assert client.post(
        "/api/v1/auth/password-reset/request",
        json={"email": family_user["email"]},
    ).status_code == 200
    reset = client.post(
        "/api/v1/auth/password-reset",
        json={
            "email": family_user["email"],
            "code": codes[0],
            "newPassword": "different-secure-password-987",
        },
    )
    assert reset.status_code == 200
    assert client.get(
        "/api/v1/auth/me", headers={"Authorization": f"Bearer {old_access_token}"}
    ).status_code == 401
    assert client.post("/api/v1/auth/refresh").status_code == 401
    assert client.post(
        "/api/v1/auth/login",
        json={"email": family_user["email"], "password": "different-secure-password-987"},
    ).status_code == 200


def test_otp_attempt_limit_and_resend_cooldown(client, app, monkeypatch):
    codes = []
    monkeypatch.setattr(
        "app.services.auth_service.send_verification_code",
        lambda email, code: codes.append(code),
    )
    app.config["OTP_MAX_ATTEMPTS"] = 2
    email = "otp-limit@example.com"
    assert client.post(
        "/api/v1/auth/register/family",
        json={
            "name": "Otp Limit",
            "email": email,
            "password": "otp-secure-password-123",
            "workspaceName": "Otp Workspace",
        },
    ).status_code == 201
    for _ in range(2):
        assert client.post(
            "/api/v1/auth/verify-otp", json={"email": email, "code": "000000"}
        ).status_code == 400
    assert client.post(
        "/api/v1/auth/verify-otp", json={"email": email, "code": codes[0]}
    ).status_code == 400
    with app.app_context():
        from datetime import datetime, timedelta, timezone
        from app.extensions import db
        from app.models.user import User

        user = db.session.scalar(db.select(User).where(User.email == email))
        assert user.otp_attempts == 2
        user.otp_last_sent_at = datetime.now(timezone.utc) - timedelta(minutes=2)
        db.session.commit()
    assert client.post("/api/v1/auth/resend-verification", json={"email": email}).status_code == 200
    assert len(codes) == 2
    verified = client.post(
        "/api/v1/auth/verify-otp", json={"email": email, "code": codes[1]}
    )
    assert verified.status_code == 200


def test_session_listing_and_revoke_others(client, family_user):
    login = client.post(
        "/api/v1/auth/login",
        json={"email": family_user["email"], "password": "test-password-123"},
    )
    first_access = login.json["accessToken"]
    other_client = client.application.test_client()
    other_login = other_client.post(
        "/api/v1/auth/login",
        json={"email": family_user["email"], "password": "test-password-123"},
    )
    listed = client.get(
        "/api/v1/auth/sessions",
        headers={"Authorization": f"Bearer {first_access}"},
    )
    assert listed.status_code == 200
    assert len(listed.json["sessions"]) == 2
    assert sum(session["current"] for session in listed.json["sessions"]) == 1
    revoked = client.post(
        "/api/v1/auth/sessions/revoke-others",
        json={},
        headers={"Authorization": f"Bearer {first_access}"},
    )
    assert revoked.status_code == 200
    assert revoked.json["revokedCount"] == 1
    assert other_client.get(
        "/api/v1/auth/me",
        headers={"Authorization": f"Bearer {other_login.json['accessToken']}"},
    ).status_code == 401


def test_rate_limit_is_recorded_as_security_event(client, app, family_user):
    app.config["LOGIN_RATE_LIMIT"] = "1 per minute"
    payload = {"email": family_user["email"], "password": "not-the-right-password"}
    assert client.post("/api/v1/auth/login", json=payload).status_code == 401
    limited = client.post("/api/v1/auth/login", json=payload)
    assert limited.status_code == 429
    with app.app_context():
        from app.extensions import db
        from app.models.security_event import SecurityEvent

        assert db.session.scalar(
            db.select(db.func.count(SecurityEvent.id)).where(
                SecurityEvent.event_type == "security.rate_limited"
            )
        ) == 1


def test_smtp_delivery_uses_configured_expiry_and_tls(app, monkeypatch):
    sent = []

    class FakeSMTP:
        def __init__(self, server, port, timeout):
            assert server == "smtp.example.test"
            assert port == 587
            assert timeout == 10

        def __enter__(self):
            return self

        def __exit__(self, exc_type, exc_value, traceback):
            return False

        def starttls(self):
            sent.append("tls")

        def login(self, username, password):
            sent.append((username, password))

        def send_message(self, message):
            sent.append(message)

    monkeypatch.setattr("app.services.email_service.smtplib.SMTP", FakeSMTP)
    app.config.update(
        OTP_DELIVERY_MODE="smtp",
        OTP_EXPIRY_MINUTES=17,
        MAIL_SERVER="smtp.example.test",
        MAIL_PORT=587,
        MAIL_USE_TLS=True,
        MAIL_USERNAME="mailer",
        MAIL_PASSWORD="mail-password",
        MAIL_DEFAULT_SENDER="no-reply@example.test",
    )
    with app.app_context():
        from app.services.email_service import send_verification_code

        send_verification_code("family@example.test", "123456")

    assert "tls" in sent
    assert ("mailer", "mail-password") in sent
    message = next(item for item in sent if not isinstance(item, str) and not isinstance(item, tuple))
    assert message["To"] == "family@example.test"
    assert "17 minutes" in message.get_content()


def test_console_delivery_does_not_log_development_verification_code(app, caplog):
    app.config.update(OTP_DELIVERY_MODE="console", DEBUG=True)
    with app.app_context():
        from app.services.email_service import send_verification_code
        from app.core.exceptions import ServiceUnavailable

        with pytest.raises(ServiceUnavailable):
            send_verification_code("family@example.test", "123456")

    assert "family@example.test" not in caplog.text
    assert "123456" not in caplog.text
