# Deployment architecture

## Repository-supported runtime

The backend is a Flask WSGI application exposed by `backend/wsgi.py`; the backend README recommends Gunicorn for production. The frontend is a Vite-built static bundle. `backend/.env.example` documents runtime settings. Application code does not define a cloud provider, container platform, production hostname, database region, CDN, or complete infrastructure-as-code deployment.

```text
Browser -- HTTPS --> static frontend host
       -- HTTPS /api/v1 --> reverse proxy or load balancer --> WSGI workers
                                                  |--> SQL database
                                                  |--> Redis rate-limit store (recommended for multiworker prod)
                                                  |--> SMTP provider
                                                  +--> Razorpay API/webhook
```

The topology is a recommended deployment shape, not a verified live environment.

## Required deployment decisions

- Terminate TLS and redirect HTTP to HTTPS at the edge; production config enables Secure cookies but does not itself provision certificates.
- Use a supported persistent production database, run Alembic migrations as a release step, and secure private network access.
- Use shared Redis-backed rate limiting for multiple workers; in-memory limits are process-local.
- Set exact browser origins in `CORS_ORIGINS`; configure trusted proxy hops only for known proxies.
- Provide SMTP TLS and Razorpay credentials/webhook signing secret through a secrets manager or protected environment injection.
- Persist uploaded files on durable private storage or explicitly accept local-disk lifetime/backup limitations.
- Set production `SECRET_KEY`, `JWT_SECRET_KEY`, `TOTP_ENCRYPTION_KEY`, secure cookie options, `APP_ENV=production`, and frontend `VITE_API_BASE_URL`.
- Add centralized logging, monitoring, alerting, database backups, restore drills, and incident response.

See [production deployment](../deployment/production-deployment.md), [local setup](../deployment/local-setup.md), and [backup strategy](../deployment/backup-strategy.md).