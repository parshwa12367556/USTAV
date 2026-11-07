from datetime import datetime, timedelta, timezone

from flask import current_app
from flask_jwt_extended import create_access_token, create_refresh_token
from werkzeug.security import check_password_hash, generate_password_hash

from app.core.exceptions import ApiError
from app.core.security import hash_password, verify_password
from app.extensions import db
from app.models.user import User
from app.models.vendor import VendorProfile
from app.models.workspace import (
    FamilyMembership,
    FamilyMembershipPermission,
    FamilyWorkspace,
)
from app.services.email_service import send_verification_code
from app.services.workspace_service import WORKSPACE_PERMISSIONS, ensure_family_workspace
from app.utils.helpers import generate_numeric_code


def _generate_verification_code() -> str:
    fixed_code = current_app.config.get("OTP_FIXED_CODE")
    if (
        current_app.config["DEBUG"]
        and current_app.config["OTP_DELIVERY_MODE"] == "console"
        and fixed_code
    ):
        if not fixed_code.isdigit() or len(fixed_code) != 6:
            raise RuntimeError("OTP_FIXED_CODE must contain exactly six digits.")
        return fixed_code
    return generate_numeric_code()


def register_user(payload: dict[str, object]) -> tuple[User, str]:
    email = str(payload["email"]).strip().lower()
    if db.session.scalar(db.select(User.id).where(User.email == email)):
        raise ApiError("An account with this email already exists.", 409)

    code = _generate_verification_code()
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


def _serialize_active_workspace(user: User) -> dict[str, object] | None:
    if user.role != "family":
        return None
    workspace = ensure_family_workspace(user)
    membership = db.session.scalar(
        db.select(FamilyMembership).where(
            FamilyMembership.workspace_id == workspace.id,
            FamilyMembership.user_id == user.id,
            FamilyMembership.status == "active",
        )
    )
    if membership is None:
        permissions = sorted(WORKSPACE_PERMISSIONS)
    elif membership.role == "owner":
        permissions = sorted(WORKSPACE_PERMISSIONS)
    else:
        permissions = db.session.scalars(
            db.select(FamilyMembershipPermission.permission)
            .where(FamilyMembershipPermission.membership_id == membership.id)
            .order_by(FamilyMembershipPermission.permission)
        ).all()
    return {
        "id": workspace.id,
        "name": workspace.name,
        "type": "family",
        "membershipId": membership.id if membership else None,
        "role": membership.role if membership else "owner",
        "permissions": list(permissions),
    }


def _serialize_active_business(user: User) -> dict[str, object] | None:
    profile = user.vendor_profile or db.session.scalar(
        db.select(VendorProfile).where(VendorProfile.user_id == user.id)
    )
    if profile is None:
        return None
    return {
        "id": profile.id,
        "name": profile.business_name,
        "type": "vendor",
        "category": profile.category,
        "verificationStatus": profile.verification_status,
    }


def build_session_context(user: User) -> dict[str, object]:
    active_workspace = _serialize_active_workspace(user) if user.role == "family" else None
    active_business = _serialize_active_business(user) if user.role == "vendor" else None
    permissions: list[str] = []
    active_role = user.role
    membership_id = None
    if active_workspace is not None:
        permissions = list(active_workspace.get("permissions", []))
        active_role = str(active_workspace.get("role") or user.role)
        membership_id = active_workspace.get("membershipId")
    elif active_business is not None:
        permissions = [
            "vendor.view",
            "vendor.manage",
            "booking.view",
            "booking.manage",
            "quotation.view",
            "quotation.manage",
            "service.manage",
        ]
    elif user.role == "admin":
        permissions = ["admin.view", "admin.manage", "platform.manage"]

    return {
        "user": user.to_dict(),
        "activeRole": active_role,
        "activeWorkspace": active_workspace,
        "activeBusiness": active_business,
        "permissions": permissions,
        "membershipId": membership_id,
        "accountStatus": "active" if user.is_active else "suspended",
    }


def create_session(user: User) -> dict[str, object]:
    claims = {"role": user.role}
    context = build_session_context(user)
    return {
        "accessToken": create_access_token(identity=user.id, additional_claims=claims),
        "refreshToken": create_refresh_token(identity=user.id, additional_claims=claims),
        **context,
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
