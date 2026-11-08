import secrets

from flask import current_app, jsonify


def session_json_response(payload: dict[str, object], session_data: dict[str, object], status: int = 200):
    refresh_token = session_data.pop("refreshToken", None)
    if not isinstance(refresh_token, str):
        raise RuntimeError("Authenticated session did not contain a refresh token.")

    csrf_token = secrets.token_urlsafe(32)
    payload["csrfToken"] = csrf_token
    response = jsonify(payload)
    response.status_code = status
    response.headers["Cache-Control"] = "no-store"
    response.set_cookie(
        current_app.config["AUTH_REFRESH_COOKIE_NAME"],
        refresh_token,
        httponly=True,
        secure=current_app.config["JWT_COOKIE_SECURE"],
        samesite=current_app.config["JWT_COOKIE_SAMESITE"],
        path=current_app.config["AUTH_COOKIE_PATH"],
        domain=current_app.config["AUTH_COOKIE_DOMAIN"],
        max_age=current_app.config["JWT_REFRESH_TOKEN_EXPIRES"],
    )
    response.set_cookie(
        current_app.config["AUTH_CSRF_COOKIE_NAME"],
        csrf_token,
        httponly=False,
        secure=current_app.config["JWT_COOKIE_SECURE"],
        samesite=current_app.config["JWT_COOKIE_SAMESITE"],
        path="/",
        domain=current_app.config["AUTH_COOKIE_DOMAIN"],
        max_age=current_app.config["JWT_REFRESH_TOKEN_EXPIRES"],
    )
    return response


def clear_auth_cookies(response):
    options = {
        "secure": current_app.config["JWT_COOKIE_SECURE"],
        "samesite": current_app.config["JWT_COOKIE_SAMESITE"],
    }
    response.delete_cookie(
        current_app.config["AUTH_REFRESH_COOKIE_NAME"],
        path=current_app.config["AUTH_COOKIE_PATH"],
        domain=current_app.config["AUTH_COOKIE_DOMAIN"],
        **options,
    )
    response.delete_cookie(
        current_app.config["AUTH_CSRF_COOKIE_NAME"],
        path="/",
        domain=current_app.config["AUTH_COOKIE_DOMAIN"],
        **options,
    )
    return response


def csrf_json_response(token: str | None = None):
    csrf_token = token or secrets.token_urlsafe(32)
    response = jsonify({"csrfToken": csrf_token})
    response.headers["Cache-Control"] = "no-store"
    if token is None:
        response.set_cookie(
            current_app.config["AUTH_CSRF_COOKIE_NAME"],
            csrf_token,
            httponly=False,
            secure=current_app.config["JWT_COOKIE_SECURE"],
            samesite=current_app.config["JWT_COOKIE_SAMESITE"],
            path="/",
            domain=current_app.config["AUTH_COOKIE_DOMAIN"],
            max_age=current_app.config["JWT_REFRESH_TOKEN_EXPIRES"],
        )
    return response
