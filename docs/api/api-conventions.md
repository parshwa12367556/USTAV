# API conventions

## Base URL and version

The backend API is mounted at `/api/v1`. Local default: `http://localhost:5000/api/v1`. Configure the frontend with `VITE_API_BASE_URL`.

## Requests and responses

- Use JSON for ordinary requests and responses. File/image and CSV upload routes use multipart form data.
- Identifiers are opaque strings; do not infer IDs, roles, or permissions from URL values.
- Dates use ISO `YYYY-MM-DD`; timestamps use ISO 8601.
- Marshmallow schemas validate documented request payloads. Extra fields are not a supported way to change server-controlled fields.
- Error responses generally use a JSON `message`; validation errors may include `errors`.
- Common statuses: `200` success, `201` creation, `204` successful deletion, `400` invalid input, `401` missing/invalid authentication, `403` forbidden, `404` unavailable/hidden resource, `409` state conflict, `410` expired invitation, `429` rate limit, and `5xx` service failure.

## Authentication

Protected routes accept the short-lived access JWT in the `Authorization: Bearer <access-token>` header (or configured JWT cookie mechanism). The frontend shared API client attaches its in-memory access token. Refresh credentials are HttpOnly cookies; do not read them in JavaScript or put them in request bodies.

State-changing requests from the browser require the CSRF token header `X-CSRF-Token` matching the CSRF cookie; a supplied Origin must be allowed. Use the frontend `apiClient` rather than a separate fetch client that omits credentials/CSRF.

## Authorization

Every private route must perform server-side authorization. Family event routes use the active membership and permission, not a client-provided role. Vendor routes use vendor membership and ownership/permission checks. Public routes are explicitly limited to published invitation lookup or token-authorized RSVP.

## Caching and privacy

Do not cache authenticated or personal-data API responses in shared caches; the backend sets `Cache-Control: no-store` for authenticated requests. Avoid writing access tokens, refresh cookies, invitation bearer tokens, or personal data to logs.

## Rate limits and idempotency

Auth and sensitive actions have configurable rate limits. Payment and webhook handlers have provider-specific semantics; do not retry mutations blindly unless the client/provider flow supports safe idempotency.

## OpenAPI

No generated OpenAPI/Swagger contract is established by this repository. This document and endpoint-specific pages summarize source behavior; verify route definitions and schemas before relying on them as a formal machine-readable contract.