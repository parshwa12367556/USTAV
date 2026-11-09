# Authentication API

Base prefix: `/api/v1/auth`. Protected requests use an access JWT. Login/verification responses set authentication cookies as appropriate; do not persist refresh credentials in browser storage.

| Method | Path | Purpose | Access |
|---|---|---|---|
| POST | `/register` | Generic validated registration | Public; public role constraints apply |
| POST | `/register/family` | Family owner registration | Public |
| POST | `/register/vendor` | Vendor owner registration | Public |
| POST | `/register/planner` | Planner registration | Public |
| POST | `/login` | Authenticate email/password | Public, rate-limited |
| POST | `/verify-otp` | Verify email code | Public, rate-limited |
| POST | `/resend-verification` | Request another verification code | Public, rate-limited |
| POST | `/2fa/setup` | Begin admin TOTP setup | Admin setup challenge |
| POST | `/2fa/verify` | Complete admin MFA | Admin challenge, rate-limited |
| POST | `/refresh` | Rotate refresh session | Refresh cookie + CSRF |
| POST | `/logout` | Revoke current session | Authenticated + CSRF |
| GET | `/me` | Current user and active membership context | Authenticated |
| PATCH | `/me` | Update profile fields | Authenticated |
| GET | `/csrf` | Obtain CSRF token/cookie | Public |
| GET | `/memberships` | List caller’s memberships | Authenticated |
| POST | `/switch-membership` | Switch to caller-owned membership | Authenticated + CSRF |
| GET | `/sessions` | List caller’s active sessions | Authenticated |
| DELETE | `/sessions/<session_id>` | Revoke a session | Authenticated |
| POST | `/sessions/revoke-others` | Revoke other sessions | Authenticated |
| POST | `/sessions/revoke-all` | Revoke sessions | Authenticated |
| POST | `/password-reset/request` | Request password-reset code | Public, rate-limited |
| POST | `/password-reset` | Set a new password with code | Public, rate-limited |
| POST | `/password/change` | Change current account password | Authenticated |

## Session response

Normal session responses include `accessToken`, user profile, `activeRole`, `activeWorkspace`/`activeBusiness`, permissions, `membershipId`, and membership choices. The refresh token is delivered as an HttpOnly cookie rather than exposed as a JSON field. Admin password sign-in returns an MFA challenge instead of a normal session.

## Security behavior

- Admin MFA setup requires an encrypted TOTP secret and verification; recovery codes are shown once.
- Login, OTP, registration, reset, refresh, and MFA limits are configured in backend environment settings.
- Refresh rotates tokens and server-side session state; reuse is rejected.
- Refresh, logout, and membership switching use CSRF/origin checks.
- Login errors should not reveal whether the account exists or the password is wrong.

Request field schemas are in `backend/app/schemas/auth_schema.py`; exact response shapes are in `backend/app/api/auth_routes.py` and auth services. Validate against these sources when adding fields.