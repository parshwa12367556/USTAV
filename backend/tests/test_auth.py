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
    assert verification.json["refreshToken"]

    login = client.post(
        "/api/v1/auth/login",
        json={"email": "family@example.com", "password": "secure-password-123"},
    )
    assert login.status_code == 200
    assert login.json["user"]["role"] == "family"


def test_fixed_registration_code_works_only_in_debug_console_mode(client, app, monkeypatch):
    verification_codes = []
    monkeypatch.setattr(
        "app.services.auth_service.send_verification_code",
        lambda email, code: verification_codes.append(code),
    )
    app.config.update(DEBUG=True, OTP_DELIVERY_MODE="console", OTP_FIXED_CODE="987654")

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
    assert response.status_code == 403
    assert "Verify your email" in response.json["message"]


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

    with app.app_context():
        from app.models.planner import PlannerProfile
        from app.models.vendor import VendorProfile
        from app.models.workspace import FamilyWorkspace

        assert db.session.scalar(
            db.select(FamilyWorkspace.name).where(
                FamilyWorkspace.owner_user_id
                == db.session.scalar(
                    db.select(User.id).where(User.email == "owner-role@example.com")
                )
            )
        ) == "The Patel Celebration"
        assert db.session.scalar(
            db.select(VendorProfile.business_name).where(
                VendorProfile.user_id
                == db.session.scalar(
                    db.select(User.id).where(User.email == "vendor-role@example.com")
                )
            )
        ) == "Lotus Catering"
        assert db.session.scalar(
            db.select(PlannerProfile.company_name).where(
                PlannerProfile.user_id
                == db.session.scalar(
                    db.select(User.id).where(User.email == "planner-role@example.com")
                )
            )
        ) == "Gather Well"


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
    switched = client.post(
        "/api/v1/auth/switch-membership",
        json={
            "membershipId": vendor_membership_id,
            "refreshToken": login.json["refreshToken"],
        },
        headers=headers,
    )
    assert switched.status_code == 200
    assert switched.json["activeRole"] == "vendor_owner"
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


def test_logout_revokes_access_and_refresh_tokens(client, app, family_user):
    from flask_jwt_extended import create_access_token, create_refresh_token

    with app.app_context():
        claims = {"role": "family"}
        access_token = create_access_token(identity=family_user["id"], additional_claims=claims)
        refresh_token = create_refresh_token(identity=family_user["id"], additional_claims=claims)

    headers = {"Authorization": f"Bearer {access_token}"}
    response = client.post(
        "/api/v1/auth/logout",
        json={"refreshToken": refresh_token},
        headers=headers,
    )

    assert response.status_code == 200
    assert client.get("/api/v1/auth/me", headers=headers).status_code == 401
    assert client.post(
        "/api/v1/auth/refresh",
        headers={"Authorization": f"Bearer {refresh_token}"},
    ).status_code == 401


def test_logout_rejects_refresh_token_from_another_user(client, app, family_user):
    from flask_jwt_extended import create_access_token, create_refresh_token

    with app.app_context():
        claims = {"role": "family"}
        access_token = create_access_token(identity=family_user["id"], additional_claims=claims)
        refresh_token = create_refresh_token(identity="different-user", additional_claims=claims)

    response = client.post(
        "/api/v1/auth/logout",
        json={"refreshToken": refresh_token},
        headers={"Authorization": f"Bearer {access_token}"},
    )

    assert response.status_code == 403
    assert client.get(
        "/api/v1/auth/me",
        headers={"Authorization": f"Bearer {access_token}"},
    ).status_code == 200


def test_refresh_rotates_and_revokes_the_previous_refresh_token(client, app, family_user):
    from flask_jwt_extended import create_refresh_token

    with app.app_context():
        old_refresh_token = create_refresh_token(
            identity=family_user["id"],
            additional_claims={"role": "family"},
        )

    refreshed = client.post(
        "/api/v1/auth/refresh",
        headers={"Authorization": f"Bearer {old_refresh_token}"},
    )

    assert refreshed.status_code == 200
    assert refreshed.json["refreshToken"] != old_refresh_token
    old_token_reuse = client.post(
        "/api/v1/auth/refresh",
        headers={"Authorization": f"Bearer {old_refresh_token}"},
    )
    assert old_token_reuse.status_code == 401


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


def test_console_delivery_logs_development_verification_code(app, caplog):
    with app.app_context():
        from app.services.email_service import send_verification_code

        send_verification_code("family@example.test", "123456")

    assert "Development verification code for family@example.test: 123456" in caplog.text
