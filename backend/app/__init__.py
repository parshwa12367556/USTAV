from __future__ import annotations

from pathlib import Path
from typing import Any

from flask import Flask, jsonify
from sqlalchemy import text
from sqlalchemy.exc import SQLAlchemyError

from app.config import get_config
from app.extensions import cors, db, jwt, ma, migrate
from app.middleware import register_error_handlers


def create_app(config_name: str | None = None, overrides: dict[str, Any] | None = None) -> Flask:
    app = Flask(__name__)
    app.config.from_object(get_config(config_name))
    if overrides:
        app.config.update(overrides)
    if app.config["INVITATION_TOKEN_EXPIRY_DAYS"] < 1:
        raise RuntimeError("INVITATION_TOKEN_EXPIRY_DAYS must be at least one.")

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

    app.config["UPLOAD_FOLDER"] = str(
        Path(app.root_path).parent / app.config.get("UPLOAD_FOLDER", "uploads")
    )
    Path(app.config["UPLOAD_FOLDER"]).mkdir(parents=True, exist_ok=True)

    db.init_app(app)
    migrate.init_app(app, db)
    jwt.init_app(app)
    ma.init_app(app)
    cors.init_app(
        app,
        resources={r"/api/*": {"origins": app.config["CORS_ORIGINS"]}},
        supports_credentials=False,
    )

    from app import models  # noqa: F401
    from app.api import api_v1
    from app.models.user import User

    @jwt.token_in_blocklist_loader
    def reject_inactive_or_stale_role(_jwt_header: dict[str, Any], jwt_payload: dict[str, Any]) -> bool:
        user = db.session.get(User, jwt_payload.get("sub"))
        return (
            user is None
            or not user.is_active
            or not user.is_verified
            or jwt_payload.get("role") != user.role
        )

    app.register_blueprint(api_v1, url_prefix="/api/v1")
    register_error_handlers(app)

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