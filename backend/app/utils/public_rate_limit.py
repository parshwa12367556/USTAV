import hashlib
import hmac

from flask import current_app, request
from flask_limiter.util import get_remote_address


def public_token_fingerprint_key() -> str:
    payload = request.get_json(silent=True) or {}
    token = payload.get("token") or payload.get("invitationToken")
    if not isinstance(token, str):
        return get_remote_address()
    key = str(current_app.secret_key).encode("utf-8")
    fingerprint = hmac.new(key, token.encode("utf-8"), hashlib.sha256).hexdigest()
    return f"token:{fingerprint}"
