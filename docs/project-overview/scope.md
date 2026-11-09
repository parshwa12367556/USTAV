# Project scope

## In scope in this repository

- React 19, TypeScript, Vite frontend.
- Flask REST API under `/api/v1`, SQLAlchemy persistence, Alembic/Flask-Migrate migrations.
- SQLite as the local default; SQLAlchemy URI support is configurable for a deployed database.
- Account registration, OTP verification, login, password reset/change, refresh sessions, logout, administrator TOTP, and workspace switching.
- Family workspaces, member permissions, planner assignments, vendor owner/staff memberships.
- Events, event functions, guests, public RSVP links, invitations, budgets, bookings, quotations, payments, vendor profiles/catalogue, venues, uploads, dashboard data, and admin operations.
- Backend pytest suite and frontend production build.

## Not included or not established

- Native Android/iOS application: no mobile client is implemented in this repository.
- A production hosting platform, data residency/region, production database, monitoring provider, or backup job cannot be inferred from application code.
- Legal approval of the draft privacy/terms copy, regulatory applicability, data-subject request operations, and breach-notification procedures are not established by code.
- End-to-end guarantees for email delivery, Razorpay settlement, cloud storage, or third-party SLAs require configured accounts and external testing.
- Some frontend catalogue/shared UI flows may not be fully wired to CRUD backend operations; verify per page before representing them as complete.

## Exclusions

Do not treat example data, frontend placeholder content, local development secrets, or the isolated demo SQLite file as production fixtures. Do not include production personal data in tests or docs.