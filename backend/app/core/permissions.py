from functools import wraps
from typing import Any, Callable

from flask_jwt_extended import get_jwt, verify_jwt_in_request

from app.core.exceptions import ApiError


def roles_required(*roles: str):
    def decorator(function: Callable[..., Any]):
        @wraps(function)
        def wrapped(*args: Any, **kwargs: Any):
            verify_jwt_in_request()
            role = get_jwt().get("role")
            if role not in roles and role != "admin":
                raise ApiError("You do not have permission to perform this action.", 403)
            return function(*args, **kwargs)

        return wrapped

    return decorator