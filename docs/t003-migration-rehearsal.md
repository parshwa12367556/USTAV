# UTSAV T003 controlled migration rehearsal

Status: **NOT READY – CRITICAL BLOCKERS**

Performed on 14 November 2026. All migration execution targeted disposable databases. No live migration, restore, downgrade, database reset or destructive cleanup was performed. Option B for FileAsset was explicitly approved by the user during the rehearsal.

## 1. Preflight evidence

The application entry point loads `backend/.env` before importing configuration. Its resolved development URI is `sqlite:///D:/UTSAV/backend/instance/utsav.db`. Configuration files and engine configuration were not changed. The app factory can implicitly create tables or attempt stamping during startup; it was never invoked against the original database in this task. Source and backup inspection used SQLite `mode=ro` connections. A minimal Flask migration host built a separate empty baseline reference, avoiding the normal factory's initialization behavior.

| Evidence | Original | Existing backup |
| --- | --- | --- |
| File | `backend/instance/utsav.db` | `backend/instance/backups/utsav_pre_t002_20261113_083719.db` |
| Size | 700,416 bytes | 700,416 bytes |
| Tables | 41 application + `alembic_version` | 41 application + `alembic_version` |
| Version rows | zero | zero |
| Integrity | `ok` | `ok` |
| Foreign-key violations | zero | zero |
| Journal mode | `delete` | `delete` |
| WAL/SHM/journal sidecars observed | none | none |
| SHA-256 | `e57707a86311b42d0a8c0c76ccd02c1ba58bfa79b89a613b4c6bb86835068864` | `21fab206b7e5677e5106fd6e789fea03f9f13f779ae7ea9a6cc40f20a37464a7` |

Different backup and source hashes are recorded, not treated as identical snapshots. SQLite backup output also need not be byte-identical to its input. No business-data equivalence between the historical backup and current source is claimed.

Revision files, graph, migration environment, app factory, configuration, registered models, upload routes and file helper were inspected. The original single HEAD was `0c8e7f1a2b34`; its parent is merge `c8d4a9f1e270`, joining `a43c91dbe827` and `4f2c8a9d1e63`. Both descend from baseline `91d2e7a4c631` through their respective branches.

## 2. Original unchanged confirmation

Original and backup size, modification timestamp, SHA-256, table lists, version rows and PRAGMA results matched their initial evidence after the work. No original or backup write connection was opened. Final verification is in `final-safety.json` beside the disposable database. This confirms observed unchanged content and timestamps; it is not an audit of unrelated external processes.

## 3. Disposable database

Absolute path: `D:\UTSAV\backend\instance\utsav_t003_iexh7zvl\rehearsal.db`.

Created through SQLite's backup API from a read-only source connection. It opened independently, matched the complete source schema, had 42 tables, zero version rows, integrity `ok` and zero FK violations. Each migration stage printed its absolute target and checked Flask's `PRAGMA database_list` result against that target. Testing overrides were supplied directly to `create_app`, without changing application connection configuration. No real uploads were made.

The reference is `D:\UTSAV\backend\instance\utsav_t003_iexh7zvl\baseline_reference.db`. Both databases and all logs are preserved under this ignored instance directory; do not publish this directory because the copied database may contain private business data.

## 4. Full baseline comparison

PASS: zero differences across all 41 application tables. The reference was constructed by executing the historical migrations from base through `91d2e7a4c631` on a separate empty database. Reflection compared every column's name, SQL type, nullability, primary-key status and server default, plus table primary keys, foreign keys including options, unique constraints, indexes and check constraints. Column order was normalized; Alembic's own version table was excluded from application-schema comparison and checked separately.

Reviewable evidence: `schema-comparison.json` contains the complete expected and actual schemas and an empty differences array. `baseline-build.log` captures reference migration output. This supersedes the existing repository helper that compared only table names.

## 5. Baseline stamping

After the full comparison passed, Flask-Migrate's `stamp` command implementation was called with explicit migration directory and verified copy configuration, equivalent to `flask db stamp 91d2e7a4c631`. The copy then contained exactly one version row: `91d2e7a4c631`. Source version rows remain empty. Full output: `existing-upgrade.log`.

## 6. Existing migrations

PASS at schema-execution level: the copy upgraded to exactly `0c8e7f1a2b34`. Log traversal:

1. `91d2e7a4c631 → 2a9c5e1f7b40 → 4f2c8a9d1e63`.
2. `91d2e7a4c631 → a43c91dbe827`.
3. Both branch heads → `c8d4a9f1e270` → `0c8e7f1a2b34`.

Five tables were added: `revoked_tokens`, `planner_profiles`, `planner_assignments`, `user_sessions`, `security_events`. The reported six missing tables included `file_assets`, which existing migrations do not create; it was added separately in this task. Security columns introduced by the authentication migration are present. Complete post-HEAD schema/evidence is available through the preserved database and verification JSON.

## 7. Guest and invitation token verification

The copy has `guests.invitation_token_hash`, `guests.invitation_revoked_at`, `guests.max_attendees` and `user_invitations.share_token_hash`. Old `invitation_token` and `share_token` columns are absent. Unique hash indexes were created by the existing migration. Migration code hashes nonempty original tokens with SHA-256 and assigns guest `max_attendees=21`, matching the model's default. No guest rows have null or out-of-range attendee limits, but this is vacuous: there are zero guest rows and zero user invitation rows in the source/copy.

Application-level verification FAILED: a controlled nonexistent token sent to `/api/v1/rsvp/lookup` returned HTTP 500 because SQLAlchemy mapper configuration fails before token lookup. The underlying error is `QuotationRequest` lacking the `items` property required by `QuotationLineItem.quotation(back_populates="items")`. No real bearer tokens or token hashes were printed.

Original-token continuity, revocation, expiry and RSVP submission are **not verified**. No existing links were available to exercise. Controlled valid legacy guest/share tokens must be seeded on another fresh disposable pre-upgrade copy, then tested through actual application endpoints after upgrade, including revoked, expired, invalid and active cases. Migration completion and empty-table validation do not establish link preservation.

## 8. FileAsset decision and retention review

The user approved **Option B**. The only model edit changes `uploaded_by`'s FK from `SET NULL` to `RESTRICT`; `nullable=False` is retained. This keeps a mandatory uploader reference and blocks deletion of an uploader while a retained FileAsset refers to that user. A future account-deletion workflow must deliberately reassign or remove the referencing asset metadata according to approved retention rules. Setting an asset's deletion status alone does not release this restriction.

Option A would preserve asset metadata after account deletion by clearing uploader identity; it allows user deletion but loses that direct attribution. Neither option defines lawful retention duration or implements deletion of stored files. No implemented FileAsset creation, retention, deletion or audit service was found: current image uploads call `save_upload`, write a UUID-named file and return a path without creating a FileAsset record. There is no verified integration between physical storage and this metadata model.

Other model findings:

- Nullable unique `sha256_checksum` enforces global uniqueness of non-null checksums and permits multiple nulls. Identical content across families/vendors would conflict if both populate the checksum. No implemented deduplication/reuse workflow was found; do not claim deduplication works or change this constraint without a separate policy decision.
- `storage_filename` and `storage_key` are independently required and unique.
- `file_size` is nullable; unknown size is accepted. No nonnegative-size check is defined.
- Composite resource index is `(resource_type, resource_id)`; resource IDs are polymorphic and have no FK.
- Family/vendor/deleter references are nullable `SET NULL`; uploader is required `RESTRICT`. All referenced tables exist.
- Eight model-defined secondary indexes were preserved. Family and vendor each have duplicate single-column indexes under different names due to both `index=True` and explicit indexes. This redundancy is preserved to avoid an unapproved model change.
- `uploader` and `user` both target User without selecting between the uploader and deleter FKs and share a backref name. These are additional mapper risks requiring a separate correction. The first observed global mapper failure is in quotations, so full FileAsset ORM behavior could not be exercised.
- Scan/deletion status fields have no implemented lifecycle enforcement here. Soft-deletion metadata does not prove physical erasure or retention compliance.

## 9. Generated migration

Path: `backend/migrations/versions/d4b9f2a6e801_add_file_assets.py`.

Revision: `d4b9f2a6e801`; parent: `0c8e7f1a2b34`; message: `add_file_assets`.

An initial unrestricted autogenerate was deliberately captured in an isolated copy of the migration directory, as revision `t003_rejected_candidate`. It was rejected and never applied or added to the real graph. Its source and `autogenerate.log` are preserved under `candidate_migrations/` in the disposable directory.

## 10. Migration review and unrelated drift

Unrestricted autogenerate proposed unrelated changes: adding event RSVP deadline and dropping event location/venue; adding payment refund fields; adding quotation revision/snapshot/approval/amount fields and self-reference; adding transaction provider-event idempotency fields/constraints; replacing guest/invitation unique hash indexes with unique constraints. Some are genuine missing migrations, while unique-index versus unique-constraint changes reflect model/history representation differences. All remain documented; historical migrations were not edited.

Generation was corrected by applying an invocation-local Alembic `include_object` filter for `file_assets` and its dependent objects, after approving Option B. This narrows the deliverable; it does not reconcile overall model/schema drift. Manual review confirmed the accepted revision creates only the 21-column FileAsset table, four FKs, three unique constraints, primary key and eight intended indexes. It does not recreate existing tables or modify user, guest or invitation schema. Defaults in this model are Python-side defaults, not server defaults; direct SQL callers must supply required values. SQLite-compatible create-table/index operations were successfully executed. Its generated downgrade was inspected but never run; the token-hashing downgrade was never invoked.

## 11. FileAsset migration verification

PASS at database level. Applied only to the verified copy. Final version row and graph HEAD are `d4b9f2a6e801`. Existing application table schemas were unchanged; only `file_assets` was added. Final count: 47 application tables plus `alembic_version`.

Controlled SQLite metadata operations, with foreign keys enabled, passed: insertion; required uploader/storage fields; unique filename/key/non-null checksum; multiple null checksums and null sizes; rejection of invalid uploader/deleter/family/vendor references; rejection of uploader deletion; and soft-delete metadata update. All controlled user/file records were inside a transaction that was rolled back. No original records were altered and no private file was uploaded. Full assertions/schema/evidence: `fileasset-verification.json`.

Final integrity is `ok`; foreign-key check returns zero violations. These SQL-level checks do not replace blocked ORM/API lifecycle tests or prove retention behavior.

## 12. Backend and frontend verification

The Flask application was instantiated on the disposable database; `/health` and `/api/v1/health` returned 200 through its test client. No network server was started. Mapper initialization failed and controlled RSVP lookup returned 500, as described above. This failure comes from existing quotation model source, which this task did not modify.

The focused/full pytest suites were not run: their shared fixture uses `db.drop_all()`, explicitly prohibited by this task, and their in-memory `create_all()` setup would not validate this migrated copy. Adapt fixtures to use disposable migrated databases without destructive cleanup before running the requested authentication, invitation, RSVP, workspace, vendor and file suites. No backend regression pass is claimed. No API/frontend change was made; frontend build was not run because no frontend compatibility change was introduced. Existing backend model/schema drift still prevents a compatibility claim.

## 13. Recovery and backup readiness

No restore was executed. For a separately authorized recovery:

1. Identify and stop the actual deployed web process/service plus workers, scheduled jobs and all SQLite writers. The deployment/service identity is not established here; do not assume the development `run.py` command describes production. Verify no remaining process holds the database or writes it.
2. Resolve absolute database and backup paths. Preserve the failed database and any `-wal`, `-shm`, `-journal` files together in a new timestamped, access-restricted incident directory; never overwrite an earlier backup. Record hashes, service state and the failure log. A WAL file can contain committed data and must not be discarded independently.
3. Open the selected backup read-only and verify integrity, FK checks, version rows, expected tables and acceptable recovery timestamp/data loss. The historical backup verified above is pre-token-hashing and differs in hash from the source; newer records may be lost if it is selected.
4. Use SQLite's backup API from that read-only backup into a uniquely named staging database in the instance directory. Verify the staging database independently before any replacement. Match application code to its schema; the pre-T002 baseline cannot run the current HEAD-dependent code correctly merely because integrity passes.
5. Only under explicit restore authorization, with every writer stopped and the failed database/sidecars preserved, replace the live database with the verified staged file. Never merge stale sidecars into the restored database. Set the intended service account ownership/ACLs. Recheck hash/integrity/FKs/schema/revision using read-only access before startup.
6. Restart the matching application release, verify health plus representative authentication/business flows and monitor errors. If checks fail, keep writers stopped and investigate the preserved evidence rather than repeatedly overwriting files.

Token hashing is irreversible: SHA-256 does not recover original bearer tokens. The existing downgrade creates fresh random tokens, invalidating historical links; it is not an acceptable rollback. Recovery requires a coherent database backup and compatible code, followed by an explicit decision about any exposed/old links. `secure_delete=ON` inside the migration does not erase historical backups, copies, logs or every storage-layer remnant.

Historical backups and this rehearsal copy can contain personal data and plaintext credentials/links. Restrict access, encrypt storage where supported, keep backups outside public serving paths, track custody, define retention/expiry and securely dispose of expired copies under an approved policy. No existing backups were deleted or overwritten. ACL/encryption effectiveness was not audited.

## 14. Remaining blockers

1. Fix quotation mapper configuration; review/fix FileAsset's ambiguous/duplicate User relationships within separately approved scope.
2. Reconcile unrelated application-model/schema drift with reviewed forward migrations or an explicitly compatible application release. Do not hide it by editing history or stamping over differences.
3. Complete controlled legacy-token migration and application-level continuity/revocation/expiry/RSVP checks after ORM repair.
4. Run relevant and full backend regressions using non-destructive fixtures against migrated disposable databases.
5. Establish file retention/account-deletion/storage-deduplication policy and lifecycle integration; Option B's database restriction alone does not implement those workflows.
6. Identify the deployment stop/start mechanism, backup ACL/retention controls and approved recovery point before live execution.

## 15. Recommended live-execution sequence

**Do not execute now. A separate explicit authorization is required after fixes and report review.**

1. Resolve the blockers, regenerate any necessary forward migrations and repeat the entire rehearsal on a fresh recent copy, including controlled pre-migration legacy tokens and application regressions. Pin the reviewed code commit and final revision IDs; new remediation migrations may change the final target beyond `d4b9f2a6e801`.
2. In an approved maintenance window, stop and verify all writers. Record current live hash, size, integrity, FK check and version rows using read-only access.
3. Create a new uniquely named SQLite-consistent backup; verify it and an independent restore staging copy. Preserve the older backup. Record the recovery plan and matching application release.
4. Repeat the complete live baseline comparison. Only if it still exactly matches `91d2e7a4c631` and version rows are empty, use an explicitly configured, path-verified migration host to run `flask db stamp 91d2e7a4c631`. Otherwise stop and reassess; do not force-stamp.
5. Run `flask db upgrade 0c8e7f1a2b34` with that verified host/configuration; capture full output and check exact version, tables, columns and integrity/FKs.
6. Run `flask db upgrade d4b9f2a6e801` only if this remains the reviewed FileAsset target, then execute any separately reviewed prerequisite/compatibility migrations in their approved graph order. Never use an unreviewed moving `head` as the deployment target.
7. Verify the final schema/revision and controlled application flows without logging tokens. Restart only the schema-compatible reviewed release; monitor and keep rollback evidence available.
8. If any stage fails, stop writers, preserve the failed database and follow the reviewed backup restore procedure. Never downgrade the token-hashing revision.

This rehearsal demonstrates baseline schema equivalence and successful SQLite migration execution for the observed copy. It does not establish production safety under concurrency, different data, service settings, storage conditions or untested application flows.
