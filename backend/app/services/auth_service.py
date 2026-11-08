from datetime import datetime, timedelta, timezone

from flask import current_app
from flask_jwt_extended import create_access_token, create_refresh_token
from werkzeug.security import check_password_hash, generate_password_hash

from app.core.exceptions import ApiError
from app.core.security import hash_password, verify_password
from app.extensions import db
from app.models.user import User
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

VENDOR_OWNER_PERMISSIONS = {
    "vendor.view",
    "vendor.manage",
    "booking.view",
    "booking.manage",
    "quotation.view",
    "quotation.manage",
    "service.manage",
}


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
) -> dict[str, object]:
    context = build_session_context(
        user, membership_id, strict_membership=strict_membership
    )
    claims = {
        "role": user.role,
        "membership_id": context["membershipId"],
    }
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
