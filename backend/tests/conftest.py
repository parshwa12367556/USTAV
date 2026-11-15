import pytest
import sqlite3
from contextlib import closing
from pathlib import Path
from flask_jwt_extended import create_access_token
from werkzeug.security import generate_password_hash

from app import create_app
from app.extensions import db
from app.models.user import User
from app.services.workspace_service import ensure_family_workspace
from migration_support import migrate_database


@pytest.fixture(scope="session")
def migrated_template(tmp_path_factory):
    path = tmp_path_factory.mktemp("migrated_template") / "template.db"
    migrate_database(path)
    return path


@pytest.fixture
def app(tmp_path, migrated_template):
    target = (tmp_path / "test.db").resolve()
    with closing(sqlite3.connect(migrated_template.as_uri() + "?mode=ro", uri=True)) as source:
        with closing(sqlite3.connect(target)) as destination:
            source.backup(destination)
    application = create_app(
        "testing",
        {
            "SQLALCHEMY_DATABASE_URI": "sqlite:///" + target.as_posix(),
            "UPLOAD_FOLDER": str(tmp_path / "uploads"),
            "SQLALCHEMY_ENGINE_OPTIONS": {},
            "OTP_DELIVERY_MODE": "disabled",
            "DEBUG": True,
            "TOTP_ENCRYPTION_KEY": "MDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDA=",
        },
    )
    with application.app_context():
        with db.engine.connect() as connection:
            assert Path(connection.exec_driver_sql("PRAGMA database_list").fetchone()[2]).resolve() == target
            assert connection.exec_driver_sql("PRAGMA foreign_keys").scalar() == 1
        try:
            yield application
        finally:
            db.session.remove()
            with db.engine.connect() as connection:
                assert connection.exec_driver_sql("PRAGMA integrity_check").fetchall() == [("ok",)]
                assert connection.exec_driver_sql("PRAGMA foreign_key_check").fetchall() == []
            db.engine.dispose()


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
