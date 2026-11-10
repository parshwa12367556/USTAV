# Authentication and session security

This page documents current backend behavior. Keep it synchronized with `backend/app/api/auth_routes.py`, `backend/app/services/auth_service.py`, `backend/app/services/session_cookie.py`, and `backend/app/config/__init__.py`.

## Public account workflows

- Register family, vendor, or planner accounts using role-specific `/api/v1/auth/register/...` endpoints.
- Email verification is required before normal login; code delivery requires SMTP configuration.
- Public registration must not create administrators.
- Login returns an authenticated session for ordinary roles. Administrator sign-in requires TOTP enrollment/verification and one-time recovery codes.
- Password reset uses a verification code. Password changes and resets invalidate sessions as implemented by the auth service.

## Credential and session controls

- Passwords are stored as password hashes through Werkzeug’s hashing utilities, not plaintext.
- New passwords require at least 12 characters, letters and digits, and must not contain account-name/email terms.
- Access JWT expiry defaults to 900 seconds; refresh expiry defaults to seven days. Configure `JWT_ACCESS_TOKEN_SECONDS` and `JWT_REFRESH_TOKEN_SECONDS`.
- Tokens issued by the current session service carry the user's `security_version`. Legacy tokens without that claim are treated as version `0`, so password resets or other security-version changes invalidate them instead of inheriting the updated version.
- Access token is held in frontend memory. Refresh token is delivered as an HttpOnly cookie; the session table stores a refresh-token hash, current JTI, device metadata, timestamps, and revocation state.
- Refresh rotates token/JTI and checks the CSRF cookie/header. Reuse/mismatch revokes the associated session.
- Logout revokes server-side session/token state, clears cookies, and frontend logout clears auth state and query cache.
- APIs should return `Cache-Control: no-store` for authenticated/private responses.

## MFA

Administrators must enroll in TOTP. Secret material is encrypted with Fernet using `TOTP_ENCRYPTION_KEY`; it must be backed up securely and kept separate from Flask/JWT keys. Recovery codes are stored as hashes and shown only during enrollment. Lost MFA recovery is operator-assisted; do not create an undocumented bypass.

## Rate limits and lockout controls

Limits are configurable for login, registration, OTP, password reset, refresh, and MFA. OTP/reset attempts and resend cooldowns are also configurable. Production multiworker deployments must use shared Redis rate-limit storage; in-memory storage does not coordinate across processes.

## Production settings

1. Use distinct high-entropy `SECRET_KEY` and `JWT_SECRET_KEY` values, plus an independent valid Fernet TOTP key.
2. Set `APP_ENV=production`, `JWT_COOKIE_SECURE=true`, and HTTPS at the edge.
3. Configure exact `CORS_ORIGINS`, cookie domain/path/SameSite for the actual frontend/API topology, and verified `TRUSTED_PROXY_HOPS`.
4. Configure shared `RATE_LIMIT_STORAGE_URI`, SMTP, and the payment webhook secret.
5. Never commit `.env`, secrets, auth tokens, recovery codes, or live user exports.

## Incident handling

Revoke affected sessions, rotate compromised secrets where necessary, preserve relevant security events, and follow the operator’s incident-response and notification process. The repository does not establish an operational breach-response team or SLA.