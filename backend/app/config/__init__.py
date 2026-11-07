from __future__ import annotations

import os
from pathlib import Path


def _default_sqlite_uri() -> str:
    backend_root = Path(__file__).resolve().parents[2]
    instance_dir = backend_root / "instance"
    instance_dir.mkdir(parents=True, exist_ok=True)
    db_path = (instance_dir / "utsav.db").resolve()
    return f"sqlite:///{db_path.as_posix()}"


def _build_database_uri() -> str:
    configured = (os.getenv("DATABASE_URL") or "").strip()
    if not configured:
        return _default_sqlite_uri()

    normalized = configured.lower()
    if normalized.startswith(("postgresql://", "postgresql+psycopg://", "postgresql+psycopg2://", "postgresql+pg8000://")):
        return _default_sqlite_uri()

    if normalized.startswith("sqlite"):
        backend_root = Path(__file__).resolve().parents[2]
        if configured.startswith("sqlite:///") and not configured.startswith("sqlite:////"):
            relative_path = configured.removeprefix("sqlite:///")
            db_path = (backend_root / relative_path).resolve()
            return f"sqlite:///{db_path.as_posix()}"
        if configured.startswith("sqlite://"):
            return configured
        return _default_sqlite_uri()

    return configured


class BaseConfig:
    SECRET_KEY = os.getenv("SECRET_KEY")
    JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY")
    SQLALCHEMY_DATABASE_URI = _build_database_uri()
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    JWT_ACCESS_TOKEN_EXPIRES = 60 * 60
    JWT_REFRESH_TOKEN_EXPIRES = 60 * 60 * 24 * 30
    SQLALCHEMY_ENGINE_OPTIONS = {
        "pool_pre_ping": True,
        "connect_args": {"check_same_thread": False} if SQLALCHEMY_DATABASE_URI.startswith("sqlite") else {},
    }
    MAX_CONTENT_LENGTH = int(os.getenv("MAX_CONTENT_LENGTH", str(10 * 1024 * 1024)))
    UPLOAD_FOLDER = os.getenv("UPLOAD_FOLDER", "uploads")
    CORS_ORIGINS = [
        origin.strip()
        for origin in os.getenv(
            "CORS_ORIGINS",
            "http://localhost:5173,http://127.0.0.1:5173",
        ).split(",")
        if origin.strip()
    ]
    OTP_DELIVERY_MODE = os.getenv("OTP_DELIVERY_MODE", "console")
    OTP_FIXED_CODE = os.getenv("OTP_FIXED_CODE")
    MAIL_SERVER = os.getenv("MAIL_SERVER")
    MAIL_PORT = int(os.getenv("MAIL_PORT", "587"))
    MAIL_USE_TLS = os.getenv("MAIL_USE_TLS", "true").lower() == "true"
    MAIL_USERNAME = os.getenv("MAIL_USERNAME")
    MAIL_PASSWORD = os.getenv("MAIL_PASSWORD")
    MAIL_DEFAULT_SENDER = os.getenv("MAIL_DEFAULT_SENDER")
    OTP_EXPIRY_MINUTES = int(os.getenv("OTP_EXPIRY_MINUTES", "10"))
    RAZORPAY_KEY_ID = os.getenv("RAZORPAY_KEY_ID")
    RAZORPAY_KEY_SECRET = os.getenv("RAZORPAY_KEY_SECRET")
    RAZORPAY_WEBHOOK_SECRET = os.getenv("RAZORPAY_WEBHOOK_SECRET")
    INVITATION_TOKEN_EXPIRY_DAYS = int(os.getenv("INVITATION_TOKEN_EXPIRY_DAYS", "90"))


class DevelopmentConfig(BaseConfig):
    DEBUG = True
    TESTING = False


class ProductionConfig(BaseConfig):
    DEBUG = False
    TESTING = False


class TestingConfig(BaseConfig):
    DEBUG = False
    TESTING = True
    SECRET_KEY = "test-only-secret-key"
    JWT_SECRET_KEY = "test-only-jwt-secret-key-at-least-32-bytes"
    SQLALCHEMY_DATABASE_URI = "sqlite://"
    SQLALCHEMY_ENGINE_OPTIONS = {}
    OTP_DELIVERY_MODE = "disabled"


config_by_name = {
    "development": DevelopmentConfig,
    "production": ProductionConfig,
    "testing": TestingConfig,
}


def get_config(name: str | None = None) -> type[BaseConfig]:
    environment = name or os.getenv("APP_ENV", os.getenv("FLASK_ENV", "development"))
    try:
        return config_by_name[environment]
    except KeyError as error:
        raise ValueError(f"Unknown application environment: {environment}") from error