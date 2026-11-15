"""Run with -I in the T006 venv against explicitly exported isolated code/DB."""
import argparse
from datetime import date, datetime, timezone
from hashlib import sha256
import json
from pathlib import Path
import secrets
import sqlite3
import sys
import traceback

parser = argparse.ArgumentParser()
parser.add_argument("--backend", type=Path, required=True)
parser.add_argument("--database", type=Path, required=True)
parser.add_argument("--result", type=Path, required=True)
args = parser.parse_args()
backend, target = args.backend.resolve(), args.database.resolve()
if backend == Path(__file__).resolve().parent or "instance" not in backend.parts or "instance" not in target.parts:
    raise RuntimeError("Only isolated exported source and private disposable DBs are accepted")
sys.path.insert(0, str(backend))
result = {"backend": str(backend), "database": str(target), "python_prefix": sys.prefix, "sys_path": sys.path}


def schema_snapshot():
    with sqlite3.connect(target.as_uri() + "?mode=ro", uri=True) as connection:
        return connection.execute("SELECT type,name,tbl_name,sql FROM sqlite_master ORDER BY type,name").fetchall()


try:
    import sqlalchemy as sa
    from sqlalchemy.orm import configure_mappers
    from alembic.autogenerate import compare_metadata
    from alembic.migration import MigrationContext
    from werkzeug.security import generate_password_hash
    from app import create_app
    from app.extensions import db
    import app.models
    configure_mappers()
    result["mappers"] = len(list(db.Model.registry.mappers))
    engine = sa.create_engine("sqlite:///" + target.as_posix())
    with engine.connect() as connection:
        diffs = compare_metadata(MigrationContext.configure(connection, opts={"compare_type": True, "compare_server_default": True}), db.metadata)
        result["schema_differences"] = [str(d) for d in diffs]
    engine.dispose()
    if diffs:
        result["status"] = "SCHEMA_INCOMPATIBLE"
    else:
        before = schema_snapshot()
        password = secrets.token_urlsafe(32)
        email = "t006-" + secrets.token_hex(8) + "@example.invalid"
        identifier = secrets.token_hex(16)
        metadata = sa.MetaData(); metadata.reflect(bind=engine)
        now = datetime.now(timezone.utc)
        with engine.begin() as connection:
            connection.exec_driver_sql("PRAGMA foreign_keys=ON")
            def insert(table, key, **values):
                connection.execute(metadata.tables[table].insert().values(id=key, created_at=now, updated_at=now, **values))
            insert("users", identifier, name="Isolated T006", email=email, password_hash=generate_password_hash(password), role="family", is_active=True, is_verified=True)
            insert("family_workspaces", identifier, owner_user_id=identifier, name="Isolated family")
            insert("family_memberships", identifier, workspace_id=identifier, user_id=identifier, role="owner", status="active")
            insert("events", identifier, owner_id=identifier, name="Isolated event", event_type="Wedding", date=date(2027, 1, 1), venue="Test venue", location="Test location", guest_count=0, status="planning")
            insert("vendor_profiles", identifier, user_id=identifier, business_name="Isolated vendor", category="Venue", city="Test", rating=0, review_count=0, verification_status="verified")
            insert("quotations", identifier, event_id=identifier, vendor_id=identifier, title="Isolated quotation", status="draft")
            insert("quotation_line_items", identifier, quotation_id=identifier, description="Isolated item", quantity=2, unit_price=12.5)
            insert("bookings", identifier, event_id=identifier, vendor_id=identifier, service_name="Isolated booking", event_date=date(2027, 1, 1), amount=25, status="confirmed")
            insert("payments", identifier, booking_id=identifier, invoice_number=identifier, amount=25, currency="INR", status="paid")
            insert("transactions", identifier, payment_id=identifier, provider="test", status="paid", response_data={})
        engine.dispose()
        app = create_app("testing", {"SQLALCHEMY_DATABASE_URI": "sqlite:///" + target.as_posix(), "UPLOAD_FOLDER": str(args.result.parent / "isolated-uploads"), "RATELIMIT_ENABLED": False, "OTP_DELIVERY_MODE": "disabled", "DEBUG": False})
        with app.app_context():
            with db.engine.connect() as connection:
                actual = Path(connection.exec_driver_sql("PRAGMA database_list").fetchone()[2]).resolve()
                if actual != target: raise RuntimeError("Application database target mismatch")
            result["startup_schema_unchanged"] = schema_snapshot() == before
            assert result["startup_schema_unchanged"]
            client = app.test_client()
            statuses = {url: client.get(url).status_code for url in ("/health", "/api/v1/health")}
            login = client.post("/api/v1/auth/login", json={"email": email, "password": password})
            statuses["login"] = login.status_code
            assert login.status_code == 200
            token = login.json.get("accessToken")
            assert isinstance(token, str)
            headers = {"Authorization": "Bearer " + token}
            for url in ("/api/v1/auth/me", "/api/v1/workspace/members", "/api/v1/events", "/api/v1/quotations", "/api/v1/bookings", "/api/v1/payments"):
                response = client.get(url, headers=headers)
                statuses[url] = response.status_code
                assert response.status_code == 200, "Smoke endpoint failed: " + url
                if url in {"/api/v1/events", "/api/v1/quotations", "/api/v1/bookings", "/api/v1/payments"}:
                    assert any(item["id"] == identifier for item in response.json)
            statuses["wrong_password"] = client.post("/api/v1/auth/login", json={"email": email, "password": secrets.token_urlsafe(32)}).status_code
            assert statuses["wrong_password"] == 401
            result["http_statuses"] = statuses
            assert all(value == 200 for key, value in statuses.items() if key != "wrong_password")
            db.session.remove(); db.engine.dispose()
        result["post_smoke_schema_unchanged"] = schema_snapshot() == before
        assert result["post_smoke_schema_unchanged"]
        with sqlite3.connect(target.as_uri() + "?mode=ro", uri=True) as connection:
            result["versions"] = connection.execute("SELECT version_num FROM alembic_version").fetchall()
            result["integrity"] = connection.execute("PRAGMA integrity_check").fetchall()
            result["fk_violations"] = len(connection.execute("PRAGMA foreign_key_check").fetchall())
        assert result["integrity"] == [("ok",)] and result["fk_violations"] == 0
        result["status"] = "PAIRING_VERIFIED"
except BaseException as error:
    result["status"] = "FAILED"
    result["error_type"] = type(error).__name__
    result["error"] = str(error)
    result["traceback"] = traceback.format_exc()
finally:
    args.result.write_text(json.dumps(result, indent=2, default=str), encoding="utf-8")
    print(json.dumps({"status": result["status"], "mappers": result.get("mappers"), "schema_difference_count": len(result.get("schema_differences", [])), "result": str(args.result)}))
