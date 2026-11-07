import pytest
from flask_jwt_extended import create_access_token
from werkzeug.security import generate_password_hash

from app import create_app
from app.extensions import db
from app.models.user import User
from app.services.workspace_service import ensure_family_workspace


@pytest.fixture
def app():
    application = create_app(
        "testing",
        {
            "SQLALCHEMY_DATABASE_URI": "sqlite://",
            "SQLALCHEMY_ENGINE_OPTIONS": {},
            "OTP_DELIVERY_MODE": "console",
            "DEBUG": True,
        },
    )
    with application.app_context():
        db.create_all()
        yield application
        db.session.remove()
        db.drop_all()


@pytest.fixture
def client(app):
    return app.test_client()


@pytest.fixture
def family_user(app):
    with app.app_context():
        user = User(
            name="Priya Sharma",
            email="priya@example.com",
            password_hash=generate_password_hash("test-password-123"),
            role="family",
            is_verified=True,
        )
        db.session.add(user)
        db.session.flush()
        ensure_family_workspace(user)
        db.session.commit()
        return {"id": user.id, "email": user.email}


@pytest.fixture
def auth_headers(app, family_user):
    with app.app_context():
        token = create_access_token(
            identity=family_user["id"],
            additional_claims={"role": "family"},
        )
    return {"Authorization": f"Bearer {token}"}