import base64
import hashlib
import hmac
import io
import secrets
import struct
import time
from urllib.parse import quote

import qrcode
import qrcode.image.svg
from cryptography.fernet import Fernet, InvalidToken
from flask import current_app

from app.core.exceptions import ApiError


def _fernet() -> Fernet:
    key = current_app.config.get("TOTP_ENCRYPTION_KEY")
    if not isinstance(key, str):
        raise ApiError("Administrator two-factor authentication is not configured.", 503)
    try:
        return Fernet(key.encode("ascii"))
    except (ValueError, UnicodeEncodeError) as error:
        raise ApiError("Administrator two-factor authentication is not configured.", 503) from error


def encrypt_totp_secret(secret: str) -> str:
    return _fernet().encrypt(secret.encode("ascii")).decode("ascii")


def decrypt_totp_secret(encrypted_secret: str) -> str:
    try:
        return _fernet().decrypt(encrypted_secret.encode("ascii")).decode("ascii")
    except (InvalidToken, UnicodeEncodeError) as error:
        raise ApiError("The administrator authenticator is unavailable.", 503) from error


def new_totp_secret() -> str:
    return base64.b32encode(secrets.token_bytes(20)).decode("ascii").rstrip("=")


def verify_totp(secret: str, code: str, *, at_time: int | None = None) -> bool:
    if len(code) != 6 or not code.isdigit():
        return False
    timestamp = int(time.time()) if at_time is None else at_time
    counter = timestamp // 30
    key = base64.b32decode(secret + "=" * (-len(secret) % 8), casefold=True)
    for offset in (-1, 0, 1):
        message = struct.pack(">Q", counter + offset)
        digest = hmac.new(key, message, hashlib.sha1).digest()
        index = digest[-1] & 0x0F
        value = struct.unpack(">I", digest[index:index + 4])[0] & 0x7FFFFFFF
        if hmac.compare_digest(f"{value % 1_000_000:06d}", code):
            return True
    return False


def create_totp_setup(secret: str, account_name: str) -> dict[str, str]:
    issuer = current_app.config["TOTP_ISSUER"]
    label = quote(f"{issuer}:{account_name}")
    uri = (
        f"otpauth://totp/{label}?secret={secret}&issuer={quote(issuer)}"
        "&algorithm=SHA1&digits=6&period=30"
    )
    image = qrcode.make(uri, image_factory=qrcode.image.svg.SvgPathImage)
    output = io.BytesIO()
    image.save(output)
    return {
        "secret": secret,
        "otpauthUri": uri,
        "qrCodeSvg": base64.b64encode(output.getvalue()).decode("ascii"),
    }


def hash_recovery_code(code: str) -> str:
    return hashlib.sha256(code.encode("utf-8")).hexdigest()

