# Backup and recovery strategy

## Current repository status

Application code defines a local SQLite default and upload directory, but does not define or prove a production backup schedule, retention, offsite copy, encryption, or restore service. The procedures below are required operator work, not an implemented backup feature.

## Data to protect

- Primary SQL database and migration state.
- Uploaded images and any future object storage.
- Required encryption/signing secrets, especially `TOTP_ENCRYPTION_KEY`, under a separate secret-backup process.
- Deployment configuration and release artifacts needed for compatible restore.

Do not store secrets in the same unprotected backup location as the database. Do not copy real customer data into developer machines.

## Required policy decisions

Document recovery point objective (RPO), recovery time objective (RTO), retention/legal holds, data region, encryption-at-rest/in-transit, access approvals, immutable/offsite storage, and deletion/expiry behavior. These values must be decided by the service operator.

## SQLite development backup

For local development only, stop writers or use SQLite’s backup API / a consistent filesystem snapshot. Do not copy only a live database file if WAL mode or active transactions may make the copy inconsistent. Verify the restore by opening the copy and checking schema/data integrity.

Production database backup/restore commands vary by selected engine and provider; this repository does not prescribe them.

## Restore drill

1. Create an isolated restore environment and obtain approvals.
2. Restore database and related uploads from a selected backup.
3. Validate integrity and Alembic revision.
4. Confirm required encryption keys are available before MFA data is used.
5. Run health checks and representative role/workspace/RSVP workflows.
6. Record duration, gaps, data loss window, and follow-up actions.

## Incident recovery

Restrict access to restored data, rotate compromised credentials/secrets when required, preserve evidence, and follow the organization’s incident-response and privacy-notification processes. The application repository does not establish those operational contacts or notification timelines.