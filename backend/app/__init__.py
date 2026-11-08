from __future__ import annotations

import os
from pathlib import Path
from datetime import datetime, timezone
from typing import Any

from cryptography.fernet import Fernet
from flask import Flask, jsonify, request
from sqlalchemy import event, text
from sqlalchemy.exc import SQLAlchemyError
from werkzeug.middleware.proxy_fix import ProxyFix

from app.config import get_config
from app.extensions import cors, db, jwt, limiter, ma, migrate
from app.middleware import register_error_handlers


def create_app(config_name: str | None = None, overrides: dict[str, Any] | None = None) -> Flask:
    app = Flask(__name__)
    app.config.from_object(get_config(config_name))
    app.config["APP_ENVIRONMENT"] = config_name or os.getenv(
        "APP_ENV", os.getenv("FLASK_ENV", "development")
    )
    if overrides:
        app.config.update(overrides)
    app.config["RATELIMIT_STORAGE_URI"] = app.config["RATE_LIMIT_STORAGE_URI"]
    if app.config["TRUSTED_PROXY_HOPS"] < 0:
        raise RuntimeError("TRUSTED_PROXY_HOPS cannot be negative.")
    if app.config["TRUSTED_PROXY_HOPS"]:
        app.wsgi_app = ProxyFix(
            app.wsgi_app,
            x_for=app.config["TRUSTED_PROXY_HOPS"],
            x_proto=app.config["TRUSTED_PROXY_HOPS"],
        )
    if app.config["INVITATION_TOKEN_EXPIRY_DAYS"] < 1:
        raise RuntimeError("INVITATION_TOKEN_EXPIRY_DAYS must be at least one.")
    if app.config["JWT_ACCESS_TOKEN_EXPIRES"] <= 0 or app.config["JWT_REFRESH_TOKEN_EXPIRES"] <= 0:
        raise RuntimeError("JWT access and refresh token lifetimes must be positive.")
    if app.config["JWT_COOKIE_SAMESITE"] not in {"Lax", "Strict", "None"}:
        raise RuntimeError("JWT_COOKIE_SAMESITE must be Lax, Strict, or None.")
    if app.config["JWT_COOKIE_SAMESITE"] == "None" and not app.config["JWT_COOKIE_SECURE"]:
        raise RuntimeError("SameSite=None refresh cookies require JWT_COOKIE_SECURE=true.")
    for setting in (
        "OTP_MAX_ATTEMPTS",
        "OTP_RESEND_COOLDOWN_SECONDS",
        "PASSWORD_RESET_MAX_ATTEMPTS",
        "PASSWORD_RESET_RESEND_COOLDOWN_SECONDS",
    ):
        if app.config[setting] < 1:
            raise RuntimeError(f"{setting} must be at least one.")

    if not app.config.get("TESTING"):
        missing = [
            setting
            for setting in ("SECRET_KEY", "JWT_SECRET_KEY", "SQLALCHEMY_DATABASE_URI")
            if not app.config.get(setting)
        ]
        if missing:
            raise RuntimeError(
                f"Missing required configuration: {', '.join(missing)}. "
                "Copy backend/.env.example to backend/.env and set these values."
            )
        if app.config["APP_ENVIRONMENT"] == "production" and app.config.get("RATE_LIMIT_STORAGE_URI") in {
            None,
            "",
            "memory://",
        }:
            raise RuntimeError(
                "Production requires a shared RATE_LIMIT_STORAGE_URI (for example Redis)."
            )
        if app.config["APP_ENVIRONMENT"] == "production" and "*" in app.config.get("CORS_ORIGINS", []):
            raise RuntimeError("Production CORS_ORIGINS must not contain a wildcard.")
        if app.config["APP_ENVIRONMENT"] == "production" and not app.config.get("TOTP_ENCRYPTION_KEY"):
            raise RuntimeError("Production requires a separate TOTP_ENCRYPTION_KEY.")
        if app.config["APP_ENVIRONMENT"] == "production":
            if not app.config["JWT_COOKIE_SECURE"]:
                raise RuntimeError("Production requires JWT_COOKIE_SECURE=true.")
            if any(
                len(app.config.get(setting) or "") < 32
                for setting in ("SECRET_KEY", "JWT_SECRET_KEY")
            ):
                raise RuntimeError("Production SECRET_KEY and JWT_SECRET_KEY must each be at least 32 characters.")
            if app.config["SECRET_KEY"] == app.config["JWT_SECRET_KEY"]:
                raise RuntimeError("Production SECRET_KEY and JWT_SECRET_KEY must be different values.")
            if app.config["TOTP_ENCRYPTION_KEY"] in {
                app.config["SECRET_KEY"],
                app.config["JWT_SECRET_KEY"],
            }:
                raise RuntimeError("TOTP_ENCRYPTION_KEY must be separate from Flask and JWT keys.")
            try:
                Fernet(app.config["TOTP_ENCRYPTION_KEY"].encode("ascii"))
            except (ValueError, UnicodeEncodeError) as error:
                raise RuntimeError("TOTP_ENCRYPTION_KEY must be a valid Fernet key.") from error
            if app.config["OTP_DELIVERY_MODE"] != "smtp" or not all(
                app.config.get(setting) for setting in ("MAIL_SERVER", "MAIL_DEFAULT_SENDER")
            ):
                raise RuntimeError("Production requires configured SMTP email delivery.")
            if not app.config["MAIL_USE_TLS"]:
                raise RuntimeError("Production SMTP delivery requires TLS.")

    app.config["UPLOAD_FOLDER"] = str(
        Path(app.root_path).parent / app.config.get("UPLOAD_FOLDER", "uploads")
    )
    Path(app.config["UPLOAD_FOLDER"]).mkdir(parents=True, exist_ok=True)

    db.init_app(app)
    if app.config["SQLALCHEMY_DATABASE_URI"].startswith("sqlite"):
        with app.app_context():
            @event.listens_for(db.engine, "connect")
            def _set_sqlite_pragma(dbapi_connection, _connection_record):
                cursor = dbapi_connection.cursor()
                cursor.execute("PRAGMA foreign_keys=ON")
                cursor.close()

    migrate.init_app(app, db)
    with app.app_context():
        from sqlalchemy import inspect

        table_names = inspect(db.engine).get_table_names()
        if not table_names:
            db.create_all()
            table_names = inspect(db.engine).get_table_names()
        if "alembic_version" not in table_names:
            try:
                migrate.stamp(revision="head")
            except Exception:
                pass

    jwt.init_app(app)
    ma.init_app(app)
    limiter.init_app(app)
    cors.init_app(
        app,
        resources={r"/api/*": {"origins": app.config["CORS_ORIGINS"]}},
        supports_credentials=True,
    )

    from app import models  # noqa: F401
    from app.api import api_v1
    from app.models.revoked_token import RevokedToken
    from app.models.user import User

    @jwt.token_in_blocklist_loader
    def reject_inactive_or_stale_role(_jwt_header: dict[str, Any], jwt_payload: dict[str, Any]) -> bool:
        user = db.session.get(User, jwt_payload.get("sub"))
        rejected = (
            user is None
            or not user.is_active
            or not user.is_verified
            or jwt_payload.get("role") != user.role
            or jwt_payload.get("security_version", user.security_version) != user.security_version
            or db.session.get(RevokedToken, jwt_payload.get("jti")) is not None
        )
        session_id = jwt_payload.get("sid")
        if session_id:
            from app.models.user_session import UserSession

            session = db.session.get(UserSession, session_id)
            session_expires_at = session.expires_at if session is not None else None
            if session_expires_at is not None and session_expires_at.tzinfo is None:
                session_expires_at = session_expires_at.replace(tzinfo=timezone.utc)
            session_expired = (
                session is None
                or session.user_id != jwt_payload.get("sub")
                or session.revoked_at is not None
                or session_expires_at <= datetime.now(timezone.utc)
            )
            refresh_reuse = (
                jwt_payload.get("type") == "refresh"
                and session is not None
                and session.current_refresh_jti != jwt_payload.get("jti")
            )
            if refresh_reuse and session is not None and session.revoked_at is None:
                from app.services.security_event_service import record_security_event

                session.revoked_at = datetime.now(timezone.utc)
                record_security_event(
                    "refresh_token.reuse",
                    "blocked",
                    user_id=session.user_id,
                    resource_type="session",
                    resource_id=session.id,
                )
                db.session.commit()
            elif not session_expired and session is not None:
                last_activity = session.last_activity_at
                if last_activity.tzinfo is None:
                    last_activity = last_activity.replace(tzinfo=timezone.utc)
                now = datetime.now(timezone.utc)
                if (now - last_activity).total_seconds() >= 60:
                    session.last_activity_at = now
                    db.session.commit()
            rejected = rejected or session_expired
            rejected = rejected or refresh_reuse
        if jwt_payload.get("mfa_pending"):
            rejected = True
        if user is not None and user.role == "admin" and (
            not user.totp_enabled or not jwt_payload.get("mfa_verified")
        ):
            rejected = True
        return rejected

    app.register_blueprint(api_v1, url_prefix="/api/v1")
    register_error_handlers(app)

    @app.after_request
    def security_headers(response):
        response.headers.setdefault("X-Content-Type-Options", "nosniff")
        response.headers.setdefault("X-Frame-Options", "DENY")
        response.headers.setdefault("Referrer-Policy", "strict-origin-when-cross-origin")
        response.headers.setdefault("Permissions-Policy", "camera=(), microphone=(), geolocation=()")
        if app.config["APP_ENVIRONMENT"] == "production":
            response.headers.setdefault(
                "Strict-Transport-Security", "max-age=31536000; includeSubDomains"
            )
        if request.path.startswith("/api/v1") and (
            request.headers.get("Authorization")
            or request.cookies.get(app.config["AUTH_REFRESH_COOKIE_NAME"])
        ):
            response.headers["Cache-Control"] = "no-store"
            response.headers["Pragma"] = "no-cache"
        return response

    @app.get("/health")
    def health():
        return jsonify({"status": "ok"}), 200

    @app.get("/api/v1/health")
    def api_health():
        try:
            db.session.execute(text("SELECT 1"))
        except SQLAlchemyError:
            app.logger.exception("Database readiness check failed")
            return jsonify({"status": "unavailable", "database": "unavailable"}), 503
        return jsonify({"status": "ok", "database": "ok"}), 200

    return app