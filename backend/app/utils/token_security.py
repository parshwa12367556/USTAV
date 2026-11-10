import hashlib
from secrets import token_urlsafe


def generate_bearer_token() -> str:
    return token_urlsafe(32)


def hash_bearer_token(token: str) -> str:
    return hashlib.sha256(token.encode("utf-8")).hexdigest()
