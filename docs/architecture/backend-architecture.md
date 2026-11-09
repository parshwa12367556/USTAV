# Backend architecture

## Runtime and dependencies

The service uses Python, Flask, Flask-JWT-Extended, Flask-SQLAlchemy, Flask-Migrate/Alembic, Marshmallow, Flask-Cors, Flask-Limiter, cryptography, and Redis support. Exact dependency ranges are declared in `backend/requirements.txt`; the repository does not pin a fully resolved lock file there.

The Flask app factory is `backend/app/__init__.py`; local entry point is `backend/run.py`, WSGI entry point is `backend/wsgi.py`. API blueprints are mounted under `/api/v1` by `backend/app/api/__init__.py`.

## Layers

- **API routes:** endpoint wiring, authentication decorators, resource authorization, request/response behavior.
- **Schemas:** request validation and serialization helpers.
- **Services:** authentication, workspace, invitation, quotation, payment, and other domain operations.
- **Models:** SQLAlchemy tables and relationships.
- **Migrations:** additive and reversible database changes where defined.

## Authentication and authorization

JWT access tokens are short-lived and accompanied by server-tracked sessions and refresh cookies. Routes use `jwt_required`; domain routes should additionally scope access through `require_event_permission`, `accessible_event_ids`, or their domain equivalent. The active membership is carried in token claims and must belong to the authenticated user.

## Persistence

SQLAlchemy URI comes from `DATABASE_URL`; local configuration defaults to `backend/instance/utsav.db`. SQLite foreign keys are enabled by an application connection hook. Schema updates belong in Alembic migrations; do not rely on `create_all` for deployed upgrades.

## Errors and operations

Central error handlers map validation, API, HTTP, rate-limit, and unexpected errors to JSON. Unexpected errors are logged server-side. Configure production logging, rotation, monitoring, and alerting externally; their availability is not guaranteed by this module.

## Tests

The pytest suite uses isolated SQLite test databases and test clients. Provider behavior is stubbed or otherwise not a live end-to-end integration. Consult [testing strategy](../testing/testing-strategy.md).