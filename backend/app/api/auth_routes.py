import time

from flask import Blueprint, request
from flask_jwt_extended import get_jwt, get_jwt_identity, jwt_required
from flask_jwt_extended.utils import decode_token
from app.core.exceptions import ApiError
from app.extensions import db
from app.models.user import User
from app.models.revoked_token import RevokedToken
from app.schemas.auth_schema import (
    FamilyRegistrationSchema,
    LoginSchema,
    MembershipSwitchSchema,
    OTPSchema,
    PlannerRegistrationSchema,
    PasswordResetRequestSchema,
    PasswordResetSchema,
    ProfileUpdateSchema,
    RegisterSchema,
    VendorRegistrationSchema,
)
from app.services.auth_service import (
    authenticate,
    build_session_context,
    create_session,
    register_user,
    request_password_reset,
    reset_password,
    verify_user_code,
)

auth_bp = Blueprint("auth", __name__)
login_schema = LoginSchema()
register_schema = RegisterSchema()
family_registration_schema = FamilyRegistrationSchema()
vendor_registration_schema = VendorRegistrationSchema()
planner_registration_schema = PlannerRegistrationSchema()
membership_switch_schema = MembershipSwitchSchema()
otp_schema = OTPSchema()
password_reset_request_schema = PasswordResetRequestSchema()
password_reset_schema = PasswordResetSchema()
profile_update_schema = ProfileUpdateSchema()


@auth_bp.post("/register")
def register():
    payload = register_schema.load(request.get_json(silent=True) or {})
    user, _code = register_user(payload)
    return {"message": "Registration received. Verify your email to continue.", "email": user.email, "verificationRequired": True}, 201


@auth_bp.post("/register/family")
def register_family():
    payload = family_registration_schema.load(request.get_json(silent=True) or {})
    user, _code = register_user({**payload, "role": "family"})
    return {"message": "Registration received. Verify your email to continue.", "email": user.email, "verificationRequired": True}, 201


@auth_bp.post("/register/vendor")
def register_vendor():
    payload = vendor_registration_schema.load(request.get_json(silent=True) or {})
    user, _code = register_user({**payload, "role": "vendor"})
    return {"message": "Registration received. Verify your email to continue.", "email": user.email, "verificationRequired": True}, 201


@auth_bp.post("/register/planner")
def register_planner():
    payload = planner_registration_schema.load(request.get_json(silent=True) or {})
    user, _code = register_user({**payload, "role": "planner"})
    return {"message": "Registration received. Verify your email to continue.", "email": user.email, "verificationRequired": True}, 201


@auth_bp.post("/login")
def login():
    payload = login_schema.load(request.get_json(silent=True) or {})
    user = authenticate(payload["email"], payload["password"])
    return create_session(
        user, payload.get("membershipId"), strict_membership=True
    )


@auth_bp.post("/verify-otp")
def verify_otp():
    payload = otp_schema.load(request.get_json(silent=True) or {})
    user = verify_user_code(payload["email"], payload["code"])
    return create_session(user)


@auth_bp.post("/refresh")
@jwt_required(refresh=True)
def refresh():
    refresh_claims = get_jwt()
    user_id = get_jwt_identity()
    user = db.session.get(User, user_id)
    if user is None or not user.is_active or not user.is_verified:
        raise ApiError("The account associated with this session is unavailable.", 401)
    session = create_session(user, refresh_claims.get("membership_id"))
    _revoke_token(refresh_claims)
    db.session.commit()
    return session


@auth_bp.post("/logout")
@jwt_required()
def logout():
    access_claims = get_jwt()
    payload = request.get_json(silent=True)
    if payload is None:
        payload = {}
    if not isinstance(payload, dict):
        raise ApiError("The logout request must be a JSON object.", 400)
    refresh_token = payload.get("refreshToken")
    tokens_to_revoke = [access_claims]

    if refresh_token is not None:
        if not isinstance(refresh_token, str) or not refresh_token:
            raise ApiError("The refresh token must be a non-empty string.", 400)
        refresh_claims = decode_token(refresh_token, allow_expired=True)
        if refresh_claims.get("type") != "refresh":
            raise ApiError("A refresh token is required to end this session.", 400)
        if refresh_claims.get("sub") != get_jwt_identity():
            raise ApiError("The refresh token does not belong to this session.", 403)
        tokens_to_revoke.append(refresh_claims)

    for token_claims in tokens_to_revoke:
        _revoke_token(token_claims)
    db.session.commit()
    return {"message": "You have been logged out."}


def _revoke_token(token_claims: dict[str, object]) -> None:
    jti = token_claims.get("jti")
    user_id = token_claims.get("sub")
    expires_at = token_claims.get("exp")
    if not isinstance(jti, str) or not isinstance(user_id, str) or not isinstance(expires_at, int):
        raise ApiError("The token is missing required session claims.", 400)

    now = int(time.time())
    db.session.execute(
        db.delete(RevokedToken).where(RevokedToken.expires_at <= now)
    )
    if expires_at > now and db.session.get(RevokedToken, jti) is None:
        db.session.add(RevokedToken(jti=jti, user_id=user_id, expires_at=expires_at))


@auth_bp.get("/me")
@jwt_required()
def me():
    user = db.session.get(User, get_jwt_identity())
    if user is None or not user.is_active:
        raise ApiError("The authenticated account is not available.", 401)
    return build_session_context(user, get_jwt().get("membership_id"))


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
    payload = membership_switch_schema.load(request.get_json(silent=True) or {})
    user = db.session.get(User, get_jwt_identity())
    if user is None or not user.is_active:
        raise ApiError("The authenticated account is not available.", 401)
    claims = get_jwt()
    refresh_token = payload["refreshToken"]
    refresh_claims = decode_token(refresh_token)
    if (
        refresh_claims.get("type") != "refresh"
        or refresh_claims.get("sub") != user.id
        or refresh_claims.get("membership_id") != claims.get("membership_id")
        or db.session.get(RevokedToken, refresh_claims.get("jti")) is not None
    ):
        raise ApiError("The refresh token does not belong to this session.", 403)
    session = create_session(user, payload["membershipId"], strict_membership=True)
    _revoke_token(claims)
    _revoke_token(refresh_claims)
    db.session.commit()
    return session


@auth_bp.post("/password-reset/request")
def request_password_reset_route():
    payload = password_reset_request_schema.load(request.get_json(silent=True) or {})
    request_password_reset(payload["email"])
    return {
        "message": "If an active account uses that email, a reset code has been sent."
    }


@auth_bp.post("/password-reset")
def reset_password_route():
    payload = password_reset_schema.load(request.get_json(silent=True) or {})
    reset_password(payload["email"], payload["code"], payload["newPassword"])
    return {"message": "Password updated. You can now sign in."}


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
