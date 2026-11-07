from flask_jwt_extended import get_jwt_identity

from app.core.exceptions import ApiError
from app.extensions import db
from app.models.user import User


def current_user() -> User:
    user_id = get_jwt_identity()
    user = db.session.get(User, user_id)
    if user is None or not user.is_active:
        raise ApiError("The authenticated account is not available.", 401)
    return user