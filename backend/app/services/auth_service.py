from datetime import datetime, timedelta, timezone

from flask import current_app
from flask_jwt_extended import create_access_token, create_refresh_token
from werkzeug.security import check_password_hash, generate_password_hash

from app.core.exceptions import ApiError
from app.core.security import hash_password, verify_password
from app.extensions import db
from app.models.user import User
from app.services.email_service import send_verification_code
from app.services.workspace_service import ensure_family_workspace
from app.utils.helpers import generate_numeric_code


def register_user(payload: dict[str, object]) -> tuple[User, str]:
    email = str(payload["email"]).strip().lower()
    if db.session.scalar(db.select(User.id).where(User.email == email)):
        raise ApiError("An account with this email already exists.", 409)

    code = generate_numeric_code()
    user = User(
        name=str(payload["name"]).strip(),
        email=email,
        phone=payload.get("phone") or None,
        password_hash=hash_password(str(payload["password"])),
        role=str(payload.get("role", "family")),
        otp_hash=generate_password_hash(code),
        otp_expires_at=datetime.now(timezone.utc)
        + timedelta(minutes=current_app.config["OTP_EXPIRY_MINUTES"]),
    )
    db.session.add(user)
    try:
        db.session.flush()
        if user.role == "family":
            ensure_family_workspace(user)
        send_verification_code(user.email, code)
        db.session.commit()
    except Exception:
        db.session.rollback()
        raise
    return user, code


def verify_user_code(email: str, code: str) -> User:
    user = db.session.scalar(db.select(User).where(User.email == email.strip().lower()))
    if user is None or user.otp_hash is None or user.otp_expires_at is None:
        raise ApiError("The verification code is invalid or expired.", 400)
    expires_at = user.otp_expires_at
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)
    if expires_at <= datetime.now(timezone.utc) or not check_password_hash(user.otp_hash, code):
        raise ApiError("The verification code is invalid or expired.", 400)
    user.is_verified = True
    user.otp_hash = None
    user.otp_expires_at = None
    db.session.commit()
    return user


def authenticate(email: str, password: str) -> User:
    user = db.session.scalar(db.select(User).where(User.email == email.strip().lower()))
    if user is None or not verify_password(user.password_hash, password):
        raise ApiError("Email or password is incorrect.", 401)
    if not user.is_active:
        raise ApiError("This account is currently disabled.", 403)
    if not user.is_verified:
        raise ApiError("Verify your email address before signing in.", 403)
    return user


def create_session(user: User) -> dict[str, object]:
    claims = {"role": user.role}
    return {
        "accessToken": create_access_token(identity=user.id, additional_claims=claims),
        "refreshToken": create_refresh_token(identity=user.id, additional_claims=claims),
        "user": user.to_dict(),
    }


def request_password_reset(email: str) -> None:
    user = db.session.scalar(db.select(User).where(User.email == email.strip().lower()))
    if user is None or not user.is_active:
        return
    code = generate_numeric_code()
    user.password_reset_hash = generate_password_hash(code)
    user.password_reset_expires_at = datetime.now(timezone.utc) + timedelta(
        minutes=current_app.config["OTP_EXPIRY_MINUTES"]
    )
    try:
        send_verification_code(user.email, code)
        db.session.commit()
    except Exception:
        db.session.rollback()
        raise


def reset_password(email: str, code: str, new_password: str) -> None:
    user = db.session.scalar(db.select(User).where(User.email == email.strip().lower()))
    if (
        user is None
        or user.password_reset_hash is None
        or user.password_reset_expires_at is None
    ):
        raise ApiError("The password reset code is invalid or expired.", 400)
    expires_at = user.password_reset_expires_at
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)
    if expires_at <= datetime.now(timezone.utc) or not check_password_hash(
        user.password_reset_hash, code
    ):
        raise ApiError("The password reset code is invalid or expired.", 400)
    user.password_hash = hash_password(new_password)
    user.password_reset_hash = None
    user.password_reset_expires_at = None
    user.otp_hash = None
    user.otp_expires_at = None
    db.session.commit()
