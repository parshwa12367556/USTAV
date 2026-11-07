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


def test_current_user_endpoint_returns_authenticated_profile(client, auth_headers):
    response = client.get("/api/v1/auth/me", headers=auth_headers)
    assert response.status_code == 200
    assert response.json["user"]["email"] == "priya@example.com"

    anonymous = client.get("/api/v1/auth/me")
    assert anonymous.status_code == 401


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
