from werkzeug.security import check_password_hash, generate_password_hash

COMMON_PASSWORDS = {
    "password1234",
    "password123456",
    "qwerty123456",
    "welcome12345",
    "letmein12345",
    "admin1234567",
}


def hash_password(password: str) -> str:
    return generate_password_hash(password)


def verify_password(password_hash: str, password: str) -> bool:
    return check_password_hash(password_hash, password)


def validate_password_strength(password: str, *, name: str = "", email: str = "") -> None:
    from app.core.exceptions import ApiError

    if len(password) < 12:
        raise ApiError("Password must contain at least 12 characters.")
    if password.lower() in COMMON_PASSWORDS:
        raise ApiError("Choose a less common password.")
    if not any(char.isalpha() for char in password) or not any(char.isdigit() for char in password):
        raise ApiError("Password must include letters and numbers.")
    account_terms = {name.lower().strip()}
    account_terms.add(email.partition("@")[0].lower().strip())
    if any(len(term) >= 4 and term in password.lower() for term in account_terms):
        raise ApiError("Password must not contain your name or email username.")