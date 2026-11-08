import hashlib
import hmac
import time
from datetime import datetime, timezone

from flask import Blueprint, current_app, jsonify, request
from flask_jwt_extended import get_jwt, get_jwt_identity, jwt_required
from flask_limiter.util import get_remote_address

from app.core.exceptions import ApiError
from app.extensions import db, limiter
from app.models.revoked_token import RevokedToken
from app.models.user import User
from app.models.user_session import UserSession
from app.schemas.auth_schema import (
    FamilyRegistrationSchema,
    LoginSchema,
    MembershipSwitchSchema,
    OTPSchema,
    PasswordChangeSchema,
    PasswordResetRequestSchema,
    PasswordResetSchema,
    PlannerRegistrationSchema,
    ProfileUpdateSchema,
    RegisterSchema,
    TotpVerifySchema,
    VendorRegistrationSchema,
)
from app.services.auth_service import (
    authenticate,
    begin_admin_mfa_setup,
    build_session_context,
    change_password,
    complete_admin_mfa,
    create_admin_challenge,
    create_session,
    register_user,
    request_password_reset,
    reset_password,
    verify_user_code,
)
from app.services.security_event_service import record_security_event
from app.services.session_cookie import clear_auth_cookies, csrf_json_response, session_json_response

auth_bp = Blueprint("auth", __name__)
login_schema = LoginSchema()
register_schema = RegisterSchema()
family_registration_schema = FamilyRegistrationSchema()
vendor_registration_schema = VendorRegistrationSchema()
planner_registration_schema = PlannerRegistrationSchema()
membership_switch_schema = MembershipSwitchSchema()
otp_schema = OTPSchema()
password_change_schema = PasswordChangeSchema()
totp_verify_schema = TotpVerifySchema()
password_reset_request_schema = PasswordResetRequestSchema()
password_reset_schema = PasswordResetSchema()
profile_update_schema = ProfileUpdateSchema()


def _account_rate_key() -> str:
    payload = request.get_json(silent=True)
    email = payload.get("email", "") if isinstance(payload, dict) else ""
    normalized = email.strip().lower() if isinstance(email, str) else ""
    return normalized or get_remote_address()


def _configured_limit(setting: str, *, key_func=None):
    return limiter.limit(lambda: current_app.config[setting], key_func=key_func)


def _require_csrf() -> None:
    expected = request.cookies.get(current_app.config["AUTH_CSRF_COOKIE_NAME"], "")
    supplied = request.headers.get(current_app.config["AUTH_CSRF_HEADER_NAME"], "")
    origin = request.headers.get("Origin")
    allowed_origins = {value.rstrip("/") for value in current_app.config["CORS_ORIGINS"]}
    if origin and origin.rstrip("/") not in allowed_origins:
        raise ApiError("The request origin is not allowed.", 403)
    if not expected or not supplied or not hmac.compare_digest(expected, supplied):
        raise ApiError("The security token is missing or invalid.", 403)


def _session_response(session_data: dict[str, object], status: int = 200):
    db.session.commit()
    return session_json_response(session_data, session_data, status)


def _admin_challenge_response(user: User, *, setup_required: bool):
    response = jsonify({
        "mfaRequired": True,
        "mfaSetupRequired": setup_required,
        "challengeToken": create_admin_challenge(user, setup_required=setup_required),
    })
    response.headers["Cache-Control"] = "no-store"
    return clear_auth_cookies(response)


def _revoke_token(token_claims: dict[str, object]) -> None:
    jti = token_claims.get("jti")
    user_id = token_claims.get("sub")
    expires_at = token_claims.get("exp")
    if not isinstance(jti, str) or not isinstance(user_id, str) or not isinstance(expires_at, int):
        raise ApiError("The token is missing required session claims.", 400)
    now = int(time.time())
    db.session.execute(db.delete(RevokedToken).where(RevokedToken.expires_at <= now))
    if expires_at > now and db.session.get(RevokedToken, jti) is None:
        db.session.add(RevokedToken(jti=jti, user_id=user_id, expires_at=expires_at))


def _user_session(session_id: object, user_id: str) -> UserSession:
    if not isinstance(session_id, str):
        raise ApiError("The session is not available.", 401)
    session = db.session.get(UserSession, session_id)
    if session is None or session.user_id != user_id or session.revoked_at is not None:
        raise ApiError("The session is not available.", 401)
    return session


@auth_bp.post("/register")
@_configured_limit("REGISTER_RATE_LIMIT")
def register():
    payload = register_schema.load(request.get_json(silent=True) or {})
    user, _code = register_user(payload)
    return {"message": "Registration received. Verify your email to continue.", "email": user.email, "verificationRequired": True}, 201


@auth_bp.post("/register/family")
@_configured_limit("REGISTER_RATE_LIMIT")
def register_family():
    payload = family_registration_schema.load(request.get_json(silent=True) or {})
    user, _code = register_user({**payload, "role": "family"})
    return {"message": "Registration received. Verify your email to continue.", "email": user.email, "verificationRequired": True}, 201


@auth_bp.post("/register/vendor")
@_configured_limit("REGISTER_RATE_LIMIT")
def register_vendor():
    payload = vendor_registration_schema.load(request.get_json(silent=True) or {})
    user, _code = register_user({**payload, "role": "vendor"})
    return {"message": "Registration received. Verify your email to continue.", "email": user.email, "verificationRequired": True}, 201


@auth_bp.post("/register/planner")
@_configured_limit("REGISTER_RATE_LIMIT")
def register_planner():
    payload = planner_registration_schema.load(request.get_json(silent=True) or {})
    user, _code = register_user({**payload, "role": "planner"})
    return {"message": "Registration received. Verify your email to continue.", "email": user.email, "verificationRequired": True}, 201


@auth_bp.post("/login")
@_configured_limit("LOGIN_RATE_LIMIT")
@_configured_limit("LOGIN_ACCOUNT_RATE_LIMIT", key_func=_account_rate_key)
def login():
    payload = login_schema.load(request.get_json(silent=True) or {})
    user = authenticate(payload["email"], payload["password"])
    if user.role == "admin":
        db.session.commit()
        return _admin_challenge_response(user, setup_required=not user.totp_enabled)
    return _session_response(create_session(user, payload.get("membershipId"), strict_membership=True))


@auth_bp.post("/verify-otp")
@_configured_limit("OTP_RATE_LIMIT")
@_configured_limit("OTP_ACCOUNT_RATE_LIMIT", key_func=_account_rate_key)
def verify_otp():
    payload = otp_schema.load(request.get_json(silent=True) or {})
    user = verify_user_code(payload["email"], payload["code"])
    if user.role == "admin":
        return _admin_challenge_response(user, setup_required=not user.totp_enabled)
    return _session_response(create_session(user))


@auth_bp.post("/resend-verification")
@_configured_limit("OTP_RESEND_RATE_LIMIT")
@_configured_limit("OTP_ACCOUNT_RATE_LIMIT", key_func=_account_rate_key)
def resend_verification():
    payload = password_reset_request_schema.load(request.get_json(silent=True) or {})
    from app.services.auth_service import resend_verification_code

    resend_verification_code(payload["email"])
    return {"message": "If verification is available, a new code has been sent."}


@auth_bp.post("/2fa/setup")
@jwt_required(skip_revocation_check=True)
@_configured_limit("MFA_RATE_LIMIT")
def setup_admin_2fa():
    claims = get_jwt()
    user = db.session.get(User, get_jwt_identity())
    if (
        user is None or not user.is_active or user.role != "admin"
        or claims.get("role") != "admin" or not claims.get("mfa_pending")
        or claims.get("security_version") != user.security_version
        or not claims.get("mfa_setup")
    ):
        raise ApiError("A valid administrator setup challenge is required.", 403)
    result = begin_admin_mfa_setup(user)
    result["challengeToken"] = request.headers.get("Authorization", "").removeprefix("Bearer ")
    return result


@auth_bp.post("/2fa/verify")
@jwt_required(skip_revocation_check=True)
@_configured_limit("MFA_RATE_LIMIT")
def verify_admin_2fa():
    claims = get_jwt()
    user = db.session.get(User, get_jwt_identity())
    if (
        user is None or not user.is_active or user.role != "admin"
        or claims.get("role") != "admin" or not claims.get("mfa_pending")
        or claims.get("security_version") != user.security_version
    ):
        raise ApiError("A valid administrator sign-in challenge is required.", 403)
    payload = totp_verify_schema.load(request.get_json(silent=True) or {})
    session_data, recovery_codes = complete_admin_mfa(user, claims, payload["code"])
    session_data["recoveryCodes"] = recovery_codes
    response = _session_response(session_data)
    return response


@auth_bp.post("/refresh")
@jwt_required(refresh=True)
@_configured_limit("REFRESH_RATE_LIMIT")
def refresh():
    _require_csrf()
    claims = get_jwt()
    user = db.session.get(User, get_jwt_identity())
    if user is None or not user.is_active or not user.is_verified:
        raise ApiError("The account associated with this session is unavailable.", 401)
    session = _user_session(claims.get("sid"), user.id)
    if session.current_refresh_jti != claims.get("jti"):
        session.revoked_at = datetime.now(timezone.utc)
        record_security_event(
            "refresh_token.reuse", "blocked", user_id=user.id,
            resource_type="session", resource_id=session.id,
        )
        db.session.commit()
        raise ApiError("The session is no longer available.", 401)
    refresh_token = request.cookies.get(current_app.config["AUTH_REFRESH_COOKIE_NAME"])
    expected_hash = hashlib.sha256(refresh_token.encode("utf-8")).hexdigest() if refresh_token else ""
    if not hmac.compare_digest(session.refresh_token_hash, expected_hash):
        session.revoked_at = datetime.now(timezone.utc)
        record_security_event(
            "refresh_token.hash_mismatch", "blocked", user_id=user.id,
            resource_type="session", resource_id=session.id,
        )
        db.session.commit()
        raise ApiError("The session is no longer available.", 401)
    membership_id = claims.get("membership_id")
    session_data = create_session(
        user,
        membership_id,
        strict_membership=membership_id is not None,
        session_id=session.id,
    )
    _revoke_token(claims)
    db.session.commit()
    return _session_response(session_data)


@auth_bp.post("/logout")
@jwt_required()
def logout():
    _require_csrf()
    claims = get_jwt()
    session_id = claims.get("sid")
    if session_id:
        session = _user_session(session_id, get_jwt_identity())
        session.revoked_at = datetime.now(timezone.utc)
    _revoke_token(claims)
    record_security_event(
        "auth.logout", "succeeded", user_id=get_jwt_identity(),
        resource_type="session", resource_id=session_id if isinstance(session_id, str) else None,
    )
    db.session.commit()
    response = jsonify({"message": "You have been logged out."})
    response.headers["Cache-Control"] = "no-store"
    return clear_auth_cookies(response)


@auth_bp.get("/me")
@jwt_required()
def me():
    user = db.session.get(User, get_jwt_identity())
    if user is None or not user.is_active:
        raise ApiError("The authenticated account is not available.", 401)
    membership_id = get_jwt().get("membership_id")
    context = build_session_context(user, membership_id)
    if membership_id is not None and context["membershipId"] != membership_id:
        raise ApiError("The active workspace is no longer available.", 401)
    response = jsonify(context)
    response.headers["Cache-Control"] = "no-store"
    return response


@auth_bp.get("/csrf")
def csrf_token():
    token = request.cookies.get(current_app.config["AUTH_CSRF_COOKIE_NAME"])
    return csrf_json_response(token)


@auth_bp.get("/memberships")
@jwt_required()
def memberships():
    user = db.session.get(User, get_jwt_identity())
    if user is None or not user.is_active:
        raise ApiError("The authenticated account is not available.", 401)
    return {"memberships": build_session_context(user)["memberships"]}


@auth_bp.post("/switch-membership")
@jwt_required()
def switch_membership():
    _require_csrf()
    payload = membership_switch_schema.load(request.get_json(silent=True) or {})
    user = db.session.get(User, get_jwt_identity())
    if user is None or not user.is_active:
        raise ApiError("The authenticated account is not available.", 401)
    claims = get_jwt()
    session = _user_session(claims.get("sid"), user.id)
    session_data = create_session(
        user,
        payload["membershipId"],
        strict_membership=True,
        session_id=session.id,
    )
    _revoke_token(claims)
    db.session.commit()
    return _session_response(session_data)


@auth_bp.get("/sessions")
@jwt_required()
def list_sessions():
    user_id = get_jwt_identity()
    current_session_id = get_jwt().get("sid")
    sessions = db.session.scalars(
        db.select(UserSession)
        .where(
            UserSession.user_id == user_id,
            UserSession.revoked_at.is_(None),
            UserSession.expires_at > datetime.now(timezone.utc),
        )
        .order_by(UserSession.last_activity_at.desc())
    ).all()
    return {"sessions": [{
        "id": item.id,
        "deviceName": item.device_name,
        "deviceType": item.device_type,
        "browser": item.browser,
        "operatingSystem": item.operating_system,
        "ipAddress": item.ip_address,
        "lastActivityAt": item.last_activity_at.isoformat(),
        "expiresAt": item.expires_at.isoformat(),
        "current": item.id == current_session_id,
    } for item in sessions]}


@auth_bp.delete("/sessions/<session_id>")
@jwt_required()
def revoke_session(session_id: str):
    user_id = get_jwt_identity()
    session = _user_session(session_id, user_id)
    session.revoked_at = datetime.now(timezone.utc)
    record_security_event(
        "auth.session_revoked", "succeeded", user_id=user_id,
        resource_type="session", resource_id=session.id,
    )
    db.session.commit()
    response = jsonify({"message": "Session revoked."})
    if get_jwt().get("sid") == session_id:
        return clear_auth_cookies(response)
    return response


@auth_bp.post("/sessions/revoke-others")
@jwt_required()
def revoke_other_sessions():
    current_session_id = get_jwt().get("sid")
    user_id = get_jwt_identity()
    if not isinstance(current_session_id, str):
        raise ApiError("The current session is not available.", 401)
    sessions = db.session.scalars(
        db.select(UserSession).where(
            UserSession.user_id == user_id,
            UserSession.revoked_at.is_(None),
            UserSession.id != current_session_id,
        )
    ).all()
    now = datetime.now(timezone.utc)
    for session in sessions:
        session.revoked_at = now
    record_security_event(
        "auth.other_sessions_revoked", "succeeded", user_id=user_id,
        metadata={"count": len(sessions)},
    )
    db.session.commit()
    return {"message": "Other sessions revoked.", "revokedCount": len(sessions)}


@auth_bp.post("/sessions/revoke-all")
@jwt_required()
def revoke_all_sessions():
    user_id = get_jwt_identity()
    user = db.session.get(User, user_id)
    if user is None:
        raise ApiError("The authenticated account is not available.", 401)
    user.security_version += 1
    sessions = db.session.scalars(
        db.select(UserSession).where(
            UserSession.user_id == user_id, UserSession.revoked_at.is_(None)
        )
    ).all()
    for session in sessions:
        session.revoked_at = datetime.now(timezone.utc)
    record_security_event("auth.all_sessions_revoked", "succeeded", user_id=user_id)
    db.session.commit()
    return clear_auth_cookies(jsonify({"message": "All sessions revoked."}))


@auth_bp.post("/password-reset/request")
@_configured_limit("PASSWORD_RESET_RATE_LIMIT")
@_configured_limit("PASSWORD_RESET_ACCOUNT_RATE_LIMIT", key_func=_account_rate_key)
def request_password_reset_route():
    payload = password_reset_request_schema.load(request.get_json(silent=True) or {})
    request_password_reset(payload["email"])
    return {
        "message": "If an active account uses that email, a reset code has been sent."
    }


@auth_bp.post("/password-reset")
@_configured_limit("OTP_RATE_LIMIT")
@_configured_limit("PASSWORD_RESET_VERIFY_RATE_LIMIT", key_func=_account_rate_key)
def reset_password_route():
    payload = password_reset_schema.load(request.get_json(silent=True) or {})
    reset_password(payload["email"], payload["code"], payload["newPassword"])
    response = jsonify({"message": "Password updated. You can now sign in."})
    return clear_auth_cookies(response)


@auth_bp.post("/password/change")
@jwt_required()
def change_password_route():
    user = db.session.get(User, get_jwt_identity())
    if user is None or not user.is_active:
        raise ApiError("The authenticated account is not available.", 401)
    payload = password_change_schema.load(request.get_json(silent=True) or {})
    change_password(user, payload["currentPassword"], payload["newPassword"])
    response = jsonify({"message": "Password updated. Sign in again with your new password."})
    return clear_auth_cookies(response)


@auth_bp.patch("/me")
@jwt_required()
def update_me():
    user = db.session.get(User, get_jwt_identity())
    if user is None or not user.is_active:
        raise ApiError("The authenticated account is not available.", 401)
    payload = profile_update_schema.load(request.get_json(silent=True) or {})
    if not payload:
        raise ApiError("At least one profile field is required.")
    for key, value in payload.items():
        setattr(user, key, value.strip() if isinstance(value, str) else value)
    db.session.commit()
    return {"user": user.to_dict()}
