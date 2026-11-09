# Production deployment guide

This guide covers application configuration. It does not declare any particular hosting provider as currently deployed.

## Before release

1. Select and document the hosting provider, region, database, storage, SMTP, Redis, payment, monitoring, and backup services.
2. Review and approve privacy/terms copy and operational incident/retention processes.
3. Build the frontend with the correct public `VITE_API_BASE_URL`.
4. Install backend requirements using the deployment lock/reproducibility policy.
5. Test migrations and rollback/restore procedures against a staging copy.
6. Configure secrets through protected environment injection or a secrets manager, never committed files.

## Required environment settings

- `APP_ENV=production`.
- Independent high-entropy `SECRET_KEY` and `JWT_SECRET_KEY` (at least 32 characters each).
- `DATABASE_URL` for the persistent production database.
- `TOTP_ENCRYPTION_KEY` as a valid Fernet key; independent of Flask/JWT keys and backed up securely.
- `JWT_COOKIE_SECURE=true`; HTTPS and SameSite/cookie-domain settings appropriate to the topology.
- `CORS_ORIGINS` set to exact trusted frontend origins, no wildcard.
- `RATE_LIMIT_STORAGE_URI` set to shared Redis or equivalent supported shared storage for multiworker runtime.
- Correct `TRUSTED_PROXY_HOPS` only when behind known, configured proxies.
- SMTP settings with TLS for verification/reset messages.
- Razorpay key ID, key secret, webhook secret only if payments are enabled.
- Persistent/private `UPLOAD_FOLDER` storage or an external durable object store implementation.

Refer to `backend/.env.example` for supported setting names/defaults. Never include secret values in release artifacts, issue reports, or logs.

## Start and migrate

Run migrations as a controlled release step:

```powershell
flask --app run db upgrade
```

Serve `backend/wsgi.py` with a production WSGI server such as Gunicorn in supported Linux deployments. Do not use Flask’s development server or debugger in production. Serve the static Vite `frontend/dist` bundle from a static host/reverse proxy, and route `/api/v1` to the WSGI service.

## Perimeter and runtime

- Enforce HTTPS and HTTP-to-HTTPS redirects at the edge.
- Keep database, Redis, object storage, and admin operations off public networks.
- Apply least privilege to runtime identities and database accounts.
- Configure body/request limits, timeouts, worker counts, health probes, and graceful shutdown for the chosen platform.
- Keep production debug disabled; do not expose stack traces or debugger endpoints.
- Restrict upload execution and public access; ensure backups include required files or the object store.
- Use centralized, access-controlled, redacted logs and actionable alerts.

## Post-deployment verification

- Check `/health` and `/api/v1/health`.
- Run smoke tests for registration/login, OTP/MFA, role/membership access, workspace isolation, RSVP invitation lifecycle, payment webhook verification, and logout.
- Confirm cookies are Secure/HttpOnly/SameSite as intended and no secrets appear in browser bundles or API responses.
- Confirm shared rate limiting across workers, current migration revision, backup job success, and monitoring alerts.
- Exercise a restore into an isolated environment before launch and periodically thereafter.

## Rollback

Prefer application rollback with backward-compatible schema changes. Do not automatically downgrade migrations in production, especially where downgrade deletes or transforms security data. Restore a verified backup only through an incident-approved procedure.