# Utsav backend

## Local setup

1. Set up the app in a local SQLite environment. The project creates `backend/instance/utsav.db` automatically.
2. From the `backend` directory, create your local environment file and open it:

   ```powershell
   Copy-Item .env.example .env
   notepad .env
   ```

   Set `SECRET_KEY` and `JWT_SECRET_KEY` to different random secrets (at least 32 characters each). Set `DATABASE_URL` to the SQLite file used by the app, for example `sqlite:///instance/utsav.db`. The application resolves this to an absolute path under `backend/instance/` automatically, so it does not depend on the terminal working directory. Do not commit `.env` or share its secrets.

   You can generate two independent secrets in PowerShell with:

   ```powershell
   python -c "import secrets; print(secrets.token_urlsafe(48))"
   python -c "import secrets; print(secrets.token_urlsafe(48))"
   ```

3. From the `backend` directory, install dependencies, apply migrations, and start the development server:

   ```powershell
   python -m pip install -r requirements.txt
   flask --app run db upgrade
   python run.py
   ```

   If startup reports missing `SECRET_KEY`, `JWT_SECRET_KEY`, or `SQLALCHEMY_DATABASE_URI`, verify that `backend/.env` exists and that the three values above are set; `DATABASE_URL` supplies `SQLALCHEMY_DATABASE_URI`.

The API health check is available at `http://localhost:5000/api/v1/health`. The Vite frontend defaults to `http://localhost:5000/api/v1`; set `VITE_API_BASE_URL` in the frontend environment to override it.

## Deployment

Install `requirements/production.txt`, set production environment variables, and run `gunicorn wsgi:app`. Apply migrations as a release step with `flask --app run db upgrade`.

Email verification and password recovery require SMTP (`OTP_DELIVERY_MODE=smtp`); configure `MAIL_SERVER`, `MAIL_PORT`, `MAIL_USE_TLS`, and `MAIL_DEFAULT_SENDER`, and set `MAIL_USERNAME`/`MAIL_PASSWORD` when the server requires authentication. Console delivery is deliberately disabled because OTPs must never be written to logs. Use a private local SMTP sink for development. Code expiry is controlled by `OTP_EXPIRY_MINUTES`.

For isolated development SMTP mail-sink tests only, `OTP_FIXED_CODE` may specify a known six-digit OTP when debug mode is enabled. Never set it in a deployed environment.

Online payments use Razorpay. Set `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET` in `.env` to enable checkout, and configure `RAZORPAY_WEBHOOK_SECRET` to accept webhooks. Register `POST /api/v1/payments/webhooks/razorpay` in the Razorpay dashboard for the `payment.captured` and `payment.failed` events. Keep all secrets server-side; only the public key ID is returned to the frontend. The automated test suite mocks provider requests and does not connect to Razorpay or SMTP.

The migrations include a starter invitation template collection and support password-reset codes. Configure SMTP delivery before enabling account recovery in a production environment.

## Authentication sessions

Access tokens are short-lived and held only in frontend memory. Refresh tokens are stored in HttpOnly, SameSite cookies scoped to `/api/v1/auth`; refresh, workspace-switch, and logout requests require a matching CSRF cookie/header and a trusted Origin when provided. Refresh tokens rotate, are persisted only as hashes with session/JTI metadata, and replay revokes the associated session. Password resets and account-status changes invalidate all sessions. The authenticated API sends private responses with `Cache-Control: no-store`.

Users can list active devices at `GET /api/v1/auth/sessions`, revoke a session with `DELETE /api/v1/auth/sessions/<id>`, or revoke other sessions with `POST /api/v1/auth/sessions/revoke-others`. Password changes use `POST /api/v1/auth/password/change`. Password creation and recovery require at least 12 characters with letters and numbers; existing passwords remain valid for login.

Administrators must enroll in TOTP after password sign-in. Setup/verification is available at `/api/v1/auth/2fa/setup` and `/api/v1/auth/2fa/verify`; one-time recovery codes are shown only on enrollment. There is intentionally no self-service MFA bypass; lost access requires operator-assisted recovery. The admin dashboard displays recent security events, and admin-only `GET /api/v1/admin/security-events` returns the latest matching records.

Production must set `JWT_COOKIE_SECURE=true` (automatically enabled by the production configuration), use HTTPS, set a private `TOTP_ENCRYPTION_KEY` generated with `python -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"`, and configure `RATE_LIMIT_STORAGE_URI` to shared Redis (the in-memory default is for single-process development/testing only). Keep the TOTP key separate from Flask/JWT keys, back it up securely, and configure exact frontend origins in `CORS_ORIGINS`. For separate frontend/API subdomains, set `AUTH_COOKIE_DOMAIN` to their common parent domain; for cross-site deployment use `JWT_COOKIE_SAMESITE=None` with Secure cookies. If traffic passes through a trusted reverse proxy, set `TRUSTED_PROXY_HOPS` to its exact hop count; do not trust forwarded headers from untrusted clients.

Migration `a43c91dbe827` adds session, MFA, OTP/reset attempt, security-version, and security-event state. Apply it with `flask --app run db upgrade` before starting this version. Verify upgrades and downgrades on a disposable database first; do not run downgrade against a live database because the new security state is removed.

## Workspace access

Registration is available for family/event organizers, vendors/service providers, and wedding planners through `/api/v1/auth/register/family`, `/api/v1/auth/register/vendor`, and `/api/v1/auth/register/planner`. Each registration is email-verified before sign-in. Admin accounts cannot be created through public registration. Vendor accounts receive a pending profile and owner membership; planners receive a planner profile. `/api/v1/auth/me` returns the authenticated account's active membership and all memberships. `/api/v1/auth/switch-membership` switches only to a membership owned by that account and rotates its tokens.

Family accounts own a workspace. Owners can create one-time, email-bound invitation links for family members or planners and assign their allowed event permissions, including whether the invitee can create events. These links expire after seven days. The link is returned to the owner to share manually; workspace invitations are not emailed by the application yet. An invitee can create an account from the token-bound link, or sign in to an existing account with the invited email. Planner invitations create a planner profile and assignment while preserving any existing account memberships.

Vendor owners can invite staff using the same seven-day, manual-link workflow and assign staff to individual bookings. An invitee can create an account from the token-bound link, or sign in to an existing account with the invited email. Staff access is limited to assigned bookings and the permitted booking actions; they cannot manage vendor profile or pricing settings.

Guest RSVP links expire after `INVITATION_TOKEN_EXPIRY_DAYS` (90 days by default). Republishing an invitation or renewing a guest link rotates its token, invalidating the previous link. Set the expiry variable to a positive number of days in `.env`.

## Administrator controls

Administrators can suspend or reactivate user accounts at `/api/v1/admin/users/<user_id>/status`. The API prevents an administrator from suspending their own account, and inactive accounts cannot continue using existing access tokens. `/api/v1/admin/audit-logs` returns the latest 200 administrative actions, including account-status changes.

The admin overview at `/api/v1/admin/dashboard` provides user, event, vendor, booking, and payment totals alongside recent bookings and payment records. It is restricted to administrators.

Administrators can manage marketplace categories at `/api/v1/admin/categories` and configure effective-dated category commission rates at `/api/v1/admin/commissions`. Migration `91d2e7a4c631` seeds categories from existing vendor profiles; deactivating a category hides its vendors from public marketplace listings. Commission CSVs report estimated amounts for paid transactions using the most recent category rate effective on the payment date; the current payment flow does not deduct commission or create vendor payouts.

CSV exports are available at `/api/v1/admin/reports?type=bookings`, `type=payments`, or `type=commissions`. Optional `from` and `to` query parameters use `YYYY-MM-DD` and filter by record creation date.

## Tests

The test suite uses an isolated SQLite database and does not require PostgreSQL credentials or a running PostgreSQL server:

```powershell
python -m pytest
```
