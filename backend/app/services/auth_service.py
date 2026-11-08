import hashlib
import secrets
from datetime import datetime, timedelta, timezone
from uuid import uuid4

from flask import current_app, request
from flask_jwt_extended import create_access_token, create_refresh_token, decode_token
from werkzeug.security import check_password_hash, generate_password_hash

from app.core.exceptions import ApiError
from app.core.security import hash_password, validate_password_strength, verify_password
from app.extensions import db
from app.models.user import User
from app.models.user_session import UserSession
from app.models.vendor import VendorProfile
from app.models.vendor_staff import VendorMembership, VendorMembershipPermission
from app.models.planner import PlannerProfile
from app.models.workspace import (
    FamilyMembership,
    FamilyMembershipPermission,
    FamilyWorkspace,
)
from app.services.email_service import send_verification_code
from app.services.workspace_service import WORKSPACE_PERMISSIONS, ensure_family_workspace
from app.utils.helpers import generate_numeric_code
from app.services.security_event_service import record_security_event

VENDOR_OWNER_PERMISSIONS = {
    "vendor.view",
    "vendor.manage",
    "booking.view",
    "booking.manage",
    "quotation.view",
    "quotation.manage",
    "service.manage",
}
_DUMMY_PASSWORD_HASH = generate_password_hash("NotARealPassword-64f1ab")


def _family_membership_context(membership: FamilyMembership) -> dict[str, object]:
    workspace = db.session.get(FamilyWorkspace, membership.workspace_id)
    if membership.role == "owner":
        permissions = sorted(WORKSPACE_PERMISSIONS)
    else:
        permissions = db.session.scalars(
            db.select(FamilyMembershipPermission.permission)
            .where(FamilyMembershipPermission.membership_id == membership.id)
            .order_by(FamilyMembershipPermission.permission)
        ).all()
    if membership.role == "planner":
        permissions = sorted(set(permissions) | {"planner.view"})
    return {
        "id": membership.id,
        "kind": "family",
        "name": workspace.name if workspace else "Family workspace",
        "workspace": {
            "id": membership.workspace_id,
            "name": workspace.name if workspace else "Family workspace",
            "type": "family",
            "membershipId": membership.id,
            "role": membership.role,
            "permissions": list(permissions),
        },
        "business": None,
        "role": "wedding_planner" if membership.role == "planner" else (
            "family_owner" if membership.role == "owner" else "family_member"
        ),
        "permissions": list(permissions),
        "membershipId": membership.id,
    }


def _vendor_membership_context(membership: VendorMembership) -> dict[str, object]:
    profile = db.session.get(VendorProfile, membership.vendor_id)
    if membership.role == "owner":
        permissions = sorted(VENDOR_OWNER_PERMISSIONS)
    else:
        permissions = db.session.scalars(
            db.select(VendorMembershipPermission.permission)
            .where(VendorMembershipPermission.membership_id == membership.id)
            .order_by(VendorMembershipPermission.permission)
        ).all()
    business = {
        "id": membership.vendor_id,
        "name": profile.business_name if profile else "Vendor workspace",
        "type": "vendor",
        "category": profile.category if profile else None,
        "verificationStatus": profile.verification_status if profile else None,
    }
    return {
        "id": membership.id,
        "kind": "vendor",
        "name": business["name"],
        "workspace": None,
        "business": business,
        "role": "vendor_owner" if membership.role == "owner" else "vendor_staff",
        "permissions": list(permissions),
        "membershipId": membership.id,
    }


def _user_memberships(user: User) -> list[dict[str, object]]:
    if user.vendor_profile is not None:
        owner_membership = db.session.scalar(
            db.select(VendorMembership).where(
                VendorMembership.vendor_id == user.vendor_profile.id,
                VendorMembership.user_id == user.id,
            )
        )
        if owner_membership is None:
            db.session.add(
                VendorMembership(
                    vendor_id=user.vendor_profile.id,
                    user_id=user.id,
                    role="owner",
                    status="active",
                )
            )
            db.session.flush()
    family_memberships = db.session.scalars(
        db.select(FamilyMembership)
        .where(
            FamilyMembership.user_id == user.id,
            FamilyMembership.status == "active",
        )
        .order_by(FamilyMembership.created_at)
    ).all()
    vendor_memberships = db.session.scalars(
        db.select(VendorMembership)
        .where(
            VendorMembership.user_id == user.id,
            VendorMembership.status == "active",
        )
        .order_by(VendorMembership.created_at)
    ).all()
    result = [
        _family_membership_context(membership) for membership in family_memberships
    ] + [_vendor_membership_context(membership) for membership in vendor_memberships]

    planner_profile = db.session.scalar(
        db.select(PlannerProfile).where(PlannerProfile.user_id == user.id)
    )
    if planner_profile is not None:
        result.append({
            "id": planner_profile.id,
            "kind": "planner",
            "name": planner_profile.company_name or f"{user.name}'s planner workspace",
            "workspace": {
                "id": planner_profile.id,
                "name": planner_profile.company_name or f"{user.name}'s planner workspace",
                "type": "planner",
                "role": "planner",
                "permissions": ["planner.view", "planner.manage"],
            },
            "business": None,
            "role": "wedding_planner",
            "permissions": ["planner.view", "planner.manage"],
            "membershipId": planner_profile.id,
        })
    if user.role == "admin":
        result.append({
            "id": f"admin:{user.id}",
            "kind": "admin",
            "name": "Platform administration",
            "workspace": None,
            "business": None,
            "role": "super_admin",
            "permissions": ["admin.view", "admin.manage", "platform.manage"],
            "membershipId": f"admin:{user.id}",
        })
    if user.role == "family" and not result:
        has_membership = db.session.scalar(
            db.select(FamilyMembership.id).where(FamilyMembership.user_id == user.id)
        )
        if has_membership is None:
            workspace = ensure_family_workspace(user)
            membership = db.session.scalar(
                db.select(FamilyMembership).where(
                    FamilyMembership.workspace_id == workspace.id,
                    FamilyMembership.user_id == user.id,
                    FamilyMembership.status == "active",
                )
            )
            if membership is not None:
                result.append(_family_membership_context(membership))
    return result


def _generate_verification_code() -> str:
    fixed_code = current_app.config.get("OTP_FIXED_CODE")
    if (
        current_app.config["DEBUG"]
        and current_app.config["OTP_DELIVERY_MODE"] == "smtp"
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
    name = str(payload["name"]).strip()
    validate_password_strength(str(payload["password"]), name=name, email=email)
    user = User(
        name=name,
        email=email,
        phone=payload.get("phone") or None,
        password_hash=hash_password(str(payload["password"])),
        role=str(payload.get("role", "family")),
        otp_hash=generate_password_hash(code),
        otp_expires_at=datetime.now(timezone.utc)
        + timedelta(minutes=current_app.config["OTP_EXPIRY_MINUTES"]),
        otp_attempts=0,
        otp_last_sent_at=datetime.now(timezone.utc),
    )
    db.session.add(user)
    try:
        db.session.flush()
        if user.role == "family":
            workspace = FamilyWorkspace(
                owner_user_id=user.id,
                name=str(payload.get("workspaceName") or f"{user.name}'s Family").strip(),
            )
            db.session.add(workspace)
            db.session.flush()
            db.session.add(
                FamilyMembership(
                    workspace_id=workspace.id,
                    user_id=user.id,
                    role="owner",
                    status="active",
                )
            )
        elif user.role == "vendor":
            business_name = payload.get("businessName")
            category = payload.get("category")
            city = payload.get("city")
            if business_name and category and city:
                profile = VendorProfile(
                    user_id=user.id,
                    business_name=str(business_name).strip(),
                    category=str(category).strip(),
                    city=str(city).strip(),
                    address=str(payload.get("address") or "").strip() or None,
                    description=str(payload.get("description") or "").strip() or None,
                    verification_status="pending",
                )
                db.session.add(profile)
                db.session.flush()
                db.session.add(
                    VendorMembership(
                        vendor_id=profile.id,
                        user_id=user.id,
                        role="owner",
                        status="active",
                    )
                )
        elif user.role == "planner":
            db.session.add(
                PlannerProfile(
                    user_id=user.id,
                    company_name=str(payload.get("companyName") or "").strip() or None,
                    years_experience=payload.get("yearsExperience"),
                )
            )
        send_verification_code(user.email, code)
        record_security_event(
            "account.registration",
            "succeeded",
            user_id=user.id,
            resource_type="user",
            resource_id=user.id,
        )
        db.session.commit()
    except Exception:
        db.session.rollback()
        raise
    return user, code


def verify_user_code(email: str, code: str) -> User:
    user = db.session.scalar(db.select(User).where(User.email == email.strip().lower()))
    if user is None or user.otp_hash is None or user.otp_expires_at is None:
        record_security_event("otp.verification", "failed")
        db.session.commit()
        raise ApiError("The verification code is invalid or expired.", 400)
    if user.otp_attempts >= current_app.config["OTP_MAX_ATTEMPTS"]:
        record_security_event(
            "otp.verification", "throttled", user_id=user.id, resource_type="user", resource_id=user.id
        )
        db.session.commit()
        raise ApiError("The verification code is invalid or expired.", 400)
    expires_at = user.otp_expires_at
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)
    if expires_at <= datetime.now(timezone.utc) or not check_password_hash(user.otp_hash, code):
        user.otp_attempts += 1
        record_security_event(
            "otp.verification", "failed", user_id=user.id, resource_type="user", resource_id=user.id
        )
        db.session.commit()
        raise ApiError("The verification code is invalid or expired.", 400)
    user.is_verified = True
    user.otp_hash = None
    user.otp_expires_at = None
    user.otp_attempts = 0
    record_security_event(
        "account.email_verified", "succeeded", user_id=user.id, resource_type="user", resource_id=user.id
    )
    db.session.commit()
    return user


def authenticate(email: str, password: str) -> User:
    user = db.session.scalar(db.select(User).where(User.email == email.strip().lower()))
    password_hash = user.password_hash if user is not None else _DUMMY_PASSWORD_HASH
    password_matches = verify_password(password_hash, password)
    if user is None or not password_matches or not user.is_active or not user.is_verified:
        record_security_event(
            "auth.login", "failed", user_id=user.id if user else None,
            metadata={"reason": "invalid_credentials"},
        )
        db.session.commit()
        raise ApiError("Email or password is incorrect.", 401)
    return user


def build_session_context(
    user: User,
    membership_id: str | None = None,
    *,
    strict_membership: bool = False,
) -> dict[str, object]:
    memberships = _user_memberships(user)
    selected = None
    if membership_id is not None:
        selected = next(
            (item for item in memberships if item["id"] == membership_id), None
        )
        if selected is None:
            if strict_membership:
                raise ApiError("The selected workspace is not available to this account.", 404)
    elif memberships:
        selected = memberships[0]
    if selected is None:
        active_role = user.role
        active_workspace = None
        active_business = None
        permissions = []
        selected_membership_id = None
    else:
        active_role = str(selected["role"])
        active_workspace = selected["workspace"]
        active_business = selected["business"]
        permissions = list(selected["permissions"])
        selected_membership_id = str(selected["membershipId"])
    return {
        "user": user.to_dict(),
        "activeRole": active_role,
        "activeWorkspace": active_workspace,
        "activeBusiness": active_business,
        "permissions": permissions,
        "membershipId": selected_membership_id,
        "memberships": memberships,
        "accountStatus": "active" if user.is_active else "suspended",
    }


def create_session(
    user: User,
    membership_id: str | None = None,
    *,
    strict_membership: bool = False,
    session_id: str | None = None,
) -> dict[str, object]:
    context = build_session_context(
        user, membership_id, strict_membership=strict_membership
    )
    now = datetime.now(timezone.utc)
    existing_session = db.session.get(UserSession, session_id) if session_id else None
    if session_id and (
        existing_session is None
        or existing_session.user_id != user.id
        or existing_session.revoked_at is not None
    ):
        raise ApiError("The session is no longer available.", 401)
    session_id = existing_session.id if existing_session else str(uuid4())
    claims = {
        "role": user.role,
        "membership_id": context["membershipId"],
        "security_version": user.security_version,
        "sid": session_id,
        "mfa_verified": user.role != "admin" or user.totp_enabled,
    }
    refresh_token = create_refresh_token(identity=user.id, additional_claims=claims)
    refresh_claims = decode_token(refresh_token)
    refresh_jti = refresh_claims["jti"]
    device, device_type, browser, operating_system = _request_device_details()
    if existing_session is None:
        db.session.add(
            UserSession(
                id=session_id,
                user_id=user.id,
                refresh_token_hash=hashlib.sha256(refresh_token.encode("utf-8")).hexdigest(),
                current_refresh_jti=refresh_jti,
                device_name=device,
                device_type=device_type,
                browser=browser,
                operating_system=operating_system,
                ip_address=request.remote_addr,
                user_agent=(request.user_agent.string or "")[:512] or None,
                last_activity_at=now,
                expires_at=now + timedelta(seconds=current_app.config["JWT_REFRESH_TOKEN_EXPIRES"]),
            )
        )
    else:
        existing_session.refresh_token_hash = hashlib.sha256(refresh_token.encode("utf-8")).hexdigest()
        existing_session.current_refresh_jti = refresh_jti
        existing_session.last_activity_at = now
        existing_session.expires_at = now + timedelta(
            seconds=current_app.config["JWT_REFRESH_TOKEN_EXPIRES"]
        )
    access_token = create_access_token(identity=user.id, additional_claims=claims)
    record_security_event(
        "auth.session_created" if existing_session is None else "auth.session_refreshed",
        "succeeded",
        user_id=user.id,
        resource_type="session",
        resource_id=session_id,
    )
    return {
        "accessToken": access_token,
        "refreshToken": refresh_token,
        "sessionId": session_id,
        **context,
    }


def _request_device_details() -> tuple[str, str, str, str]:
    user_agent = request.user_agent
    browser = (user_agent.browser or "Unknown browser")[:80]
    operating_system = (user_agent.platform or "Unknown OS")[:80]
    device_type = "mobile" if user_agent.platform in {"android", "iphone", "ipad"} else "desktop"
    device_name = f"{browser} on {operating_system}"[:120]
    return device_name, device_type, browser, operating_system


def create_admin_challenge(user: User, *, setup_required: bool) -> str:
    record_security_event(
        "admin.mfa_challenge", "succeeded", user_id=user.id,
        resource_type="user", resource_id=user.id,
    )
    return create_access_token(
        identity=user.id,
        additional_claims={
            "role": user.role,
            "security_version": user.security_version,
            "mfa_pending": True,
            "mfa_setup": setup_required,
        },
        expires_delta=timedelta(minutes=5),
    )


def complete_admin_mfa(user: User, challenge_claims: dict[str, object], code: str) -> tuple[dict[str, object], list[str]]:
    from app.core.totp import decrypt_totp_secret, hash_recovery_code, verify_totp

    if user.role != "admin" or challenge_claims.get("role") != "admin":
        raise ApiError("Administrator authentication is required.", 403)
    if challenge_claims.get("security_version") != user.security_version:
        raise ApiError("The administrator sign-in challenge has expired.", 401)

    recovery_codes: list[str] = []
    if user.totp_enabled:
        secret = user.totp_secret_encrypted
        if secret is None or not verify_totp(decrypt_totp_secret(secret), code):
            candidate_hash = hashlib.sha256(code.strip().upper().encode("utf-8")).hexdigest()
            existing_hashes = list(user.recovery_codes_hashes or [])
            matched_index = next(
                (index for index, value in enumerate(existing_hashes)
                 if secrets.compare_digest(value, candidate_hash)),
                None,
            )
            if matched_index is None:
                record_security_event(
                    "admin.mfa_verification", "failed", user_id=user.id,
                    resource_type="user", resource_id=user.id,
                )
                db.session.commit()
                raise ApiError("The authenticator code is invalid.", 401)
            existing_hashes.pop(matched_index)
            user.recovery_codes_hashes = existing_hashes
            record_security_event(
                "admin.mfa_recovery_code", "succeeded", user_id=user.id,
                resource_type="user", resource_id=user.id,
            )
    else:
        if not challenge_claims.get("mfa_setup"):
            raise ApiError("Administrator two-factor authentication setup is required.", 403)
        if user.totp_secret_encrypted is None:
            raise ApiError("Start administrator two-factor authentication setup first.", 400)
        if not verify_totp(decrypt_totp_secret(user.totp_secret_encrypted), code):
            record_security_event(
                "admin.mfa_verification", "failed", user_id=user.id,
                resource_type="user", resource_id=user.id,
            )
            db.session.commit()
            raise ApiError("The authenticator code is invalid.", 401)
        recovery_codes = [secrets.token_hex(5).upper() for _ in range(10)]
        user.recovery_codes_hashes = [hash_recovery_code(value) for value in recovery_codes]
        user.totp_enabled = True

    context = build_session_context(user)
    session = create_session(user, context["membershipId"])
    record_security_event(
        "admin.mfa_verification", "succeeded", user_id=user.id,
        resource_type="user", resource_id=user.id,
    )
    db.session.commit()
    return session, recovery_codes


def begin_admin_mfa_setup(user: User) -> dict[str, str]:
    from app.core.totp import create_totp_setup, encrypt_totp_secret, new_totp_secret

    if user.role != "admin" or user.totp_enabled:
        raise ApiError("Two-factor setup is unavailable for this account.", 403)
    secret = new_totp_secret()
    user.totp_secret_encrypted = encrypt_totp_secret(secret)
    db.session.commit()
    record_security_event(
        "admin.mfa_setup_started", "succeeded", user_id=user.id,
        resource_type="user", resource_id=user.id,
    )
    return create_totp_setup(secret, user.email)


def request_password_reset(email: str) -> None:
    user = db.session.scalar(db.select(User).where(User.email == email.strip().lower()))
    if user is None or not user.is_active:
        return
    now = datetime.now(timezone.utc)
    sent_at = user.password_reset_last_sent_at
    if sent_at is not None:
        if sent_at.tzinfo is None:
            sent_at = sent_at.replace(tzinfo=timezone.utc)
        if (now - sent_at).total_seconds() < current_app.config["PASSWORD_RESET_RESEND_COOLDOWN_SECONDS"]:
            return
    code = generate_numeric_code()
    user.password_reset_hash = generate_password_hash(code)
    user.password_reset_expires_at = now + timedelta(
        minutes=current_app.config["OTP_EXPIRY_MINUTES"]
    )
    user.password_reset_attempts = 0
    user.password_reset_last_sent_at = now
    try:
        send_verification_code(user.email, code)
        record_security_event(
            "password_reset.requested", "succeeded", user_id=user.id,
            resource_type="user", resource_id=user.id,
        )
        db.session.commit()
    except Exception:
        db.session.rollback()
        raise


def resend_verification_code(email: str) -> None:
    user = db.session.scalar(db.select(User).where(User.email == email.strip().lower()))
    if user is None or user.is_verified or not user.is_active:
        return
    now = datetime.now(timezone.utc)
    sent_at = user.otp_last_sent_at
    if sent_at is not None:
        if sent_at.tzinfo is None:
            sent_at = sent_at.replace(tzinfo=timezone.utc)
        if (now - sent_at).total_seconds() < current_app.config["OTP_RESEND_COOLDOWN_SECONDS"]:
            return
    code = _generate_verification_code()
    user.otp_hash = generate_password_hash(code)
    user.otp_expires_at = now + timedelta(minutes=current_app.config["OTP_EXPIRY_MINUTES"])
    user.otp_attempts = 0
    user.otp_last_sent_at = now
    try:
        send_verification_code(user.email, code)
        record_security_event(
            "otp.resent", "succeeded", user_id=user.id,
            resource_type="user", resource_id=user.id,
        )
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
        record_security_event("password_reset.verification", "failed", user_id=user.id if user else None)
        db.session.commit()
        raise ApiError("The password reset code is invalid or expired.", 400)
    if user.password_reset_attempts >= current_app.config["PASSWORD_RESET_MAX_ATTEMPTS"]:
        record_security_event(
            "password_reset.verification", "throttled", user_id=user.id,
            resource_type="user", resource_id=user.id,
        )
        db.session.commit()
        raise ApiError("The password reset code is invalid or expired.", 400)
    expires_at = user.password_reset_expires_at
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)
    if expires_at <= datetime.now(timezone.utc) or not check_password_hash(
        user.password_reset_hash, code
    ):
        user.password_reset_attempts += 1
        record_security_event(
            "password_reset.verification", "failed", user_id=user.id,
            resource_type="user", resource_id=user.id,
        )
        db.session.commit()
        raise ApiError("The password reset code is invalid or expired.", 400)
    validate_password_strength(new_password, name=user.name, email=user.email)
    user.password_hash = hash_password(new_password)
    user.password_reset_hash = None
    user.password_reset_expires_at = None
    user.password_reset_attempts = 0
    user.password_reset_last_sent_at = None
    user.otp_hash = None
    user.otp_expires_at = None
    user.security_version += 1
    _revoke_user_sessions(user.id)
    record_security_event(
        "password_reset.completed", "succeeded", user_id=user.id,
        resource_type="user", resource_id=user.id,
    )
    db.session.commit()


def _revoke_user_sessions(user_id: str, *, except_session_id: str | None = None) -> None:
    now = datetime.now(timezone.utc)
    sessions = db.session.scalars(
        db.select(UserSession).where(
            UserSession.user_id == user_id,
            UserSession.revoked_at.is_(None),
        )
    ).all()
    for session in sessions:
        if session.id != except_session_id:
            session.revoked_at = now


def change_password(user: User, current_password: str, new_password: str) -> None:
    if not verify_password(user.password_hash, current_password):
        record_security_event(
            "password_change", "failed", user_id=user.id, resource_type="user", resource_id=user.id
        )
        db.session.commit()
        raise ApiError("The current password is incorrect.", 400)
    validate_password_strength(new_password, name=user.name, email=user.email)
    user.password_hash = hash_password(new_password)
    user.security_version += 1
    _revoke_user_sessions(user.id)
    record_security_event(
        "password_change", "succeeded", user_id=user.id, resource_type="user", resource_id=user.id
    )
    db.session.commit()
