from flask import Blueprint, request
from flask_jwt_extended import get_jwt_identity, jwt_required
from marshmallow import ValidationError

from app.core.exceptions import ApiError
from app.extensions import db
from app.models.user import User
from app.schemas.auth_schema import (
    LoginSchema,
    OTPSchema,
    PasswordResetRequestSchema,
    PasswordResetSchema,
    ProfileUpdateSchema,
    RegisterSchema,
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
otp_schema = OTPSchema()
password_reset_request_schema = PasswordResetRequestSchema()
password_reset_schema = PasswordResetSchema()
profile_update_schema = ProfileUpdateSchema()


@auth_bp.post("/register")
def register():
    payload = register_schema.load(request.get_json(silent=True) or {})
    user, _code = register_user(payload)
    return {"message": "Registration received. Verify your email to continue.", "email": user.email, "verificationRequired": True}, 201


@auth_bp.post("/login")
def login():
    payload = login_schema.load(request.get_json(silent=True) or {})
    user = authenticate(payload["email"], payload["password"])
    return create_session(user)


@auth_bp.post("/verify-otp")
def verify_otp():
    payload = otp_schema.load(request.get_json(silent=True) or {})
    user = verify_user_code(payload["email"], payload["code"])
    return create_session(user)


@auth_bp.post("/refresh")
@jwt_required(refresh=True)
def refresh():
    user_id = get_jwt_identity()
    user = db.session.get(User, user_id)
    if user is None or not user.is_active or not user.is_verified:
        raise ApiError("The account associated with this session is unavailable.", 401)
    return create_session(user)


@auth_bp.get("/me")
@jwt_required()
def me():
    user = db.session.get(User, get_jwt_identity())
    if user is None or not user.is_active:
        raise ApiError("The authenticated account is not available.", 401)
    return build_session_context(user)


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
