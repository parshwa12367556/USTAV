# Database design

## Technology and schema lifecycle

Persistence uses SQLAlchemy models and Flask-Migrate/Alembic. Local configuration defaults to SQLite at `backend/instance/utsav.db`; use a supported external database URI for production only after confirming driver, migration, transaction, and operational compatibility. The repository includes migration history under `backend/migrations/versions`.

Use migrations for schema changes. `create_all()` exists for empty/test database initialization; it is not a substitute for production migration deployment. Test upgrades and downgrades against disposable database copies before release.

Most domain records inherit `BaseModel`, which supplies UUID-string `id`, `created_at`, and `updated_at`. Exceptions such as revoked-token records have their own primary keys.

## Relational design

- **Identity/security:** `users`, `user_sessions`, `revoked_tokens`, `security_events`.
- **Family tenancy:** `family_workspaces` -> `family_memberships` -> `family_membership_permissions`; pending invitations have separate invitation and permission tables. `events.owner_id` links an event to its family owner; authorization resolves the active workspace.
- **Planner access:** `planner_profiles` and `planner_assignments` connect planners to family memberships/workspaces.
- **Vendor tenancy:** `vendor_profiles` -> `vendor_memberships` -> `vendor_membership_permissions`; staff invitations and booking assignments are separate tables.
- **Event planning:** `events` -> `event_functions`, `guests`, and `budget_categories`; groups and guest-function links support guest organization. RSVP rows link guest and function.
- **Commerce:** vendor catalogues and venues; bookings connect event and vendor; quotations connect event/vendor with line items; payments link bookings with transactions/invoices.
- **Platform/admin:** categories, commission rules, invitation templates, audit logs, notifications, and supporting organization/family records.

See the [ER diagram](er-diagram.md) and [data dictionary](data-dictionary.md).

## Integrity and isolation

Foreign keys define cascade/set-null/restrict behavior in model declarations. Unique constraints protect emails, memberships, category/group names, guest-function links, RSVP per guest/function, vendor availability, invoice numbers, tokens, and other domain keys.

SQLite foreign-key enforcement is enabled by an application connection hook. Other DB engines must enforce equivalent foreign keys and transaction semantics. Row-level security policies are not defined by the repository; tenant isolation is implemented in API/service queries and must be tested at the application layer.

## Sensitive fields

Password, OTP, and password-reset values are represented as hashes; admin TOTP seed is encrypted; session refresh tokens and workspace/vendor invitation tokens are stored as hashes where implemented. Guest RSVP invitation tokens are currently stored raw in `guests.invitation_token`; restrict database/backups and consider hashing at rest.

## Deletion and retention

Foreign-key cascades remove related event/workspace/vendor children in defined cases. This is not a complete account-deletion or retention policy. Define operational deletion, backup expiry, legal holds, and audit/security retention separately.