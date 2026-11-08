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

Email verification and password recovery use SMTP when `OTP_DELIVERY_MODE=smtp`; configure `MAIL_SERVER`, `MAIL_PORT`, `MAIL_USE_TLS`, and `MAIL_DEFAULT_SENDER`, and set `MAIL_USERNAME`/`MAIL_PASSWORD` when the server requires authentication. Local console mode logs verification codes only in development. Code expiry is controlled by `OTP_EXPIRY_MINUTES`.

For local registration testing only, set `OTP_FIXED_CODE=987654` to use the same verification code for each new registration. This setting is honored only when debug mode and console OTP delivery are both enabled; it is ignored in production and SMTP mode. Do not enable a fixed code in a deployed environment.

Online payments use Razorpay. Set `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET` in `.env` to enable checkout, and configure `RAZORPAY_WEBHOOK_SECRET` to accept webhooks. Register `POST /api/v1/payments/webhooks/razorpay` in the Razorpay dashboard for the `payment.captured` and `payment.failed` events. Keep all secrets server-side; only the public key ID is returned to the frontend. The automated test suite mocks provider requests and does not connect to Razorpay or SMTP.

The migrations include a starter invitation template collection and support password-reset codes. Configure SMTP delivery before enabling account recovery in a production environment.

## Authentication sessions

Refresh tokens are rotated when used, and the previous refresh token is immediately invalidated. `POST /api/v1/auth/logout` revokes the current access and refresh tokens. Migration `4f2c8a9d1e63` adds planner profiles and business addresses; it follows migration `2a9c5e1f7b40`, which adds persistent revoked-token storage. Apply migrations with `flask --app run db upgrade` before starting an existing database with this version.

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
