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
    JWT_ACCESS_TOKEN_EXPIRES = int(os.getenv("JWT_ACCESS_TOKEN_SECONDS", "900"))
    JWT_REFRESH_TOKEN_EXPIRES = int(os.getenv("JWT_REFRESH_TOKEN_SECONDS", "604800"))
    JWT_TOKEN_LOCATION = ["cookies", "headers"]
    JWT_REFRESH_COOKIE_NAME = "utsav_refresh"
    JWT_COOKIE_CSRF_PROTECT = False
    JWT_COOKIE_SECURE = os.getenv("JWT_COOKIE_SECURE", "false").lower() == "true"
    JWT_COOKIE_SAMESITE = os.getenv("JWT_COOKIE_SAMESITE", "Lax")
    AUTH_REFRESH_COOKIE_NAME = "utsav_refresh"
    AUTH_CSRF_COOKIE_NAME = "utsav_csrf"
    AUTH_COOKIE_DOMAIN = os.getenv("AUTH_COOKIE_DOMAIN") or None
    AUTH_COOKIE_PATH = "/api/v1/auth"
    JWT_REFRESH_COOKIE_PATH = AUTH_COOKIE_PATH
    AUTH_CSRF_HEADER_NAME = "X-CSRF-Token"
    TOTP_ENCRYPTION_KEY = os.getenv("TOTP_ENCRYPTION_KEY")
    RATE_LIMIT_STORAGE_URI = os.getenv("RATE_LIMIT_STORAGE_URI", "memory://")
    TRUSTED_PROXY_HOPS = int(os.getenv("TRUSTED_PROXY_HOPS", "0"))
    RATELIMIT_HEADERS_ENABLED = True
    PUBLIC_RSVP_LOOKUP_LIMIT = os.getenv("PUBLIC_RSVP_LOOKUP_LIMIT", "60 per minute")
    PUBLIC_RSVP_SUBMIT_LIMIT = os.getenv("PUBLIC_RSVP_SUBMIT_LIMIT", "10 per minute")
    PUBLIC_RSVP_INVALID_LIMIT = os.getenv("PUBLIC_RSVP_INVALID_LIMIT", "10 per minute")
    PUBLIC_INVALID_TOKEN_LIMIT = os.getenv("PUBLIC_INVALID_TOKEN_LIMIT", "5 per hour")
    PUBLIC_INVITATION_LOOKUP_LIMIT = os.getenv("PUBLIC_INVITATION_LOOKUP_LIMIT", "60 per minute")
    PUBLIC_INVITATION_INVALID_LIMIT = os.getenv("PUBLIC_INVITATION_INVALID_LIMIT", "10 per minute")
    LOGIN_RATE_LIMIT = os.getenv("LOGIN_RATE_LIMIT", "5 per minute")
    LOGIN_ACCOUNT_RATE_LIMIT = os.getenv("LOGIN_ACCOUNT_RATE_LIMIT", "10 per hour")
    REGISTER_RATE_LIMIT = os.getenv("REGISTER_RATE_LIMIT", "5 per hour")
    OTP_RATE_LIMIT = os.getenv("OTP_RATE_LIMIT", "5 per 10 minutes")
    OTP_ACCOUNT_RATE_LIMIT = os.getenv("OTP_ACCOUNT_RATE_LIMIT", "5 per hour")
    OTP_RESEND_RATE_LIMIT = os.getenv("OTP_RESEND_RATE_LIMIT", "3 per hour")
    PASSWORD_RESET_RATE_LIMIT = os.getenv("PASSWORD_RESET_RATE_LIMIT", "3 per hour")
    PASSWORD_RESET_ACCOUNT_RATE_LIMIT = os.getenv("PASSWORD_RESET_ACCOUNT_RATE_LIMIT", "3 per day")
    PASSWORD_RESET_VERIFY_RATE_LIMIT = os.getenv("PASSWORD_RESET_VERIFY_RATE_LIMIT", "5 per hour")
    REFRESH_RATE_LIMIT = os.getenv("REFRESH_RATE_LIMIT", "20 per minute")
    MFA_RATE_LIMIT = os.getenv("MFA_RATE_LIMIT", "5 per 10 minutes")
    OTP_MAX_ATTEMPTS = int(os.getenv("OTP_MAX_ATTEMPTS", "5"))
    OTP_RESEND_COOLDOWN_SECONDS = int(os.getenv("OTP_RESEND_COOLDOWN_SECONDS", "60"))
    PASSWORD_RESET_MAX_ATTEMPTS = int(os.getenv("PASSWORD_RESET_MAX_ATTEMPTS", "5"))
    PASSWORD_RESET_RESEND_COOLDOWN_SECONDS = int(
        os.getenv("PASSWORD_RESET_RESEND_COOLDOWN_SECONDS", "60")
    )
    TOTP_ISSUER = os.getenv("TOTP_ISSUER", "UTSAV")
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
    JWT_COOKIE_SECURE = True


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