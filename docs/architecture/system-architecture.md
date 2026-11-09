# System architecture

## Components

```text
Browser
  React + TypeScript + Vite
     | HTTPS in deployment (must be configured)
     | JSON REST, credentials cookies, bearer access token
     v
Flask application (/api/v1)
  blueprints -> schemas -> route/service logic -> SQLAlchemy models
     |                                      |
     | SMTP                                  +--> configured SQL database
     + Razorpay Orders API / signed webhook
```

The diagram shows integrations supported by code, not verified deployed infrastructure. No mobile client is present. The backend currently defaults to a local SQLite database. See [deployment architecture](deployment-architecture.md) and [database design](../database/database-design.md).

## Request flow

1. The frontend calls the Flask API at `VITE_API_BASE_URL` (defaults to `http://localhost:5000/api/v1`).
2. Protected requests carry an in-memory access token. Refresh credentials are issued as HttpOnly cookies; state-changing calls use CSRF protection.
3. Flask routes authenticate requests and apply validation and resource/permission checks.
4. SQLAlchemy persists data; workspace queries must scope private event data by the authenticated user’s active membership.
5. External service calls, notably SMTP and Razorpay, are configuration-dependent.

## Cross-cutting concerns

- Authentication/session enforcement: `backend/app/api/auth_routes.py`, `backend/app/services/auth_service.py`, `backend/app/__init__.py`.
- Workspace permissions and event ownership: `backend/app/services/workspace_service.py`.
- Input schemas: `backend/app/schemas` and route-local Marshmallow schemas.
- Versioned migrations: `backend/migrations/versions`.
- Backend integration tests: `backend/tests`.

## Data classes

The data model includes identities and sessions; family and vendor memberships; planner assignments; events and functions; guests, groups, RSVPs, and invitation tokens; vendor profiles/catalogue, venues, bookings, quotations, budgets, payments, audit/security events, notifications, and uploads. See the [data dictionary](../database/data-dictionary.md).

## Trust boundaries

- Browser-provided IDs, roles, permissions, and invitation tokens are untrusted input.
- Invitation/RSVP links are bearer credentials: anyone possessing a valid link can use its public workflow.
- Client-side route guards are UX only; backend authorization is required.
- Database files, environment values, SMTP, Razorpay, and reverse-proxy headers are deployment trust boundaries.