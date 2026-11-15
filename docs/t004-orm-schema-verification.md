# UTSAV T004 — ORM and schema verification

Final status: **COMPLETED – VERIFIED**.

Final evidence: **89 backend tests passed**, zero failures/errors/skips; **47 mappers configured**; **zero model/schema differences including server defaults**; SQLite integrity `ok` and zero FK violations; original database and existing backup unchanged. Ready for another full disposable-copy rehearsal, not live execution.

Performed on 14 November 2026. This task repaired application models and tested forward migrations on disposable databases only. No live stamp, upgrade, downgrade, restore or backup replacement was performed. The previously approved FileAsset uploader policy remains required (`nullable=False`) with `ondelete="RESTRICT"`.

## 1. Root causes and confirmed repairs

| Finding | Root cause | Repair and evidence |
| --- | --- | --- |
| Quotation mapper failure | `QuotationLineItem.quotation` declared `back_populates="items"`, but `QuotationRequest.items` did not exist. The actual FK is `quotation_line_items.quotation_id → quotations.id`. `QuotationRequest` is the only mapped quotations entity; no separate mapped `Quotation` class exists. | Added the reciprocal items collection and explicit FK selection on both sides. Delete-orphan semantics support existing routes that replace a quotation's line-item collection. ORM regression verifies reciprocal access and orphan removal; existing quotation lifecycle/amount tests pass. |
| FileAsset ambiguous joins | Two FKs lead to users, but relationships did not select an FK. Both `uploader` and `user` independently attempted the same `uploaded_files` backref. | Distinct uploader/deleter relationships with explicit `foreign_keys` and reciprocal `User.uploaded_files` / `User.deleted_files`. Retained `FileAsset.user` as a synonym for uploader, preserving its Python alias without a second mapper relationship. |
| ORM bypass of deletion policy | A normal reverse collection may cause SQLAlchemy to null a child's FK when deleting a parent, conflicting with mandatory uploader attribution. | `passive_deletes="all"` on user collections delegates `RESTRICT`/`SET NULL` to SQLite, including when collections are loaded. Tests cover loaded/unloaded uploader deletion rejection, querying and alias access, and deleter deletion clearing attribution. |
| Event mappings absent | Database columns `venue`/`location` were absent from metadata even though event constructors, serializers and public invitation/RSVP routes still use them. | Restored their nullable `String(255)` model columns. No data/column deletion or API shape change. Controlled migration preserves both values. |
| SQLite RSVP deadline comparison | SQLite returns timezone-naive datetimes; comparing a loaded deadline directly with aware UTC can raise TypeError. | Interpret a naive stored deadline as UTC, consistent with invitation expiry handling. Added a round-trip regression. |
| Newly rotated guest token unusable | Rotation preserved a prior revocation timestamp after changing the token hash, contrary to the existing regression/API expectation for authorized reissuance. | Authorized rotation now clears revocation for the new token. Old tokens still fail because their hashes are no longer stored. Existing rotation/revocation/expiry test passes unchanged. |

All 47 registered mappers were inspected through `configure_mappers()` and the resulting relationship registry. Every declared reciprocal was checked against the target mapper and its reverse relationship. No other mapper initialization errors or confirmed reciprocal defects remain. Unidirectional relationships were not given unnecessary reverse collections. Duplicate FileAsset import was removed and FileAsset added to the models export list.

## 2. Complete drift inventory

The starting schema was the T003 disposable database at `d4b9f2a6e801`. The original T003 unrestricted autogenerate evidence was considered together with a fresh unrestricted comparison including server defaults. No table filters or comparison suppression are used in final verification.

| Objects | Classification | Resolution |
| --- | --- | --- |
| `events.venue`, `events.location` | 3 — incorrect model definition | Restore mappings to existing columns; never drop them. |
| `events.rsvp_deadline`; `ix_events_rsvp_deadline` | 1 — missing forward migration | Add nullable deadline and index; old events retain no deadline. |
| `payments.refund_amount`, `refund_status`, `refund_provider_reference`, `refund_initiated_by`, `refund_timestamp` | 1 — missing forward migration | Add existing declared model fields. Existing rows receive amount `0`, status `pending`, other fields null. Persist matching server defaults for required fields. These defaults do not prove a refund is underway or implement a refund workflow. |
| `quotations.revision`, `previous_quotation_id`, `revised_by`, `revised_at`, `requires_fresh_approval`, `items_snapshot`, `total_amount`; `fk_quotation_previous` | 1 — missing forward migration | Add declared model fields and nullable self-FK. Required defaults match model defaults: revision `1`, fresh approval false, snapshot `{}`, amount `0`. Backfill historical total from retained line items. Existing status, valid-until and all old columns remain unchanged. |
| `transactions.provider_event_id`, `ix_transactions_provider_event_id`, `uq_provider_event_id(provider, provider_event_id)` | 1 — missing forward migration | Add nullable event ID and provider-scoped unique constraint/index. Existing rows remain null; no historical event IDs are invented. Tests reject duplicate non-null IDs within a provider, permit the same ID across providers, and permit multiple nulls. |
| Guest hash unique index versus inline unique constraint | 2 — equivalent uniqueness, different representation | Metadata now declares the existing named unique index `uq_guests_invitation_token_hash`; no database rebuild or uniqueness weakening. |
| Invitation hash unique index versus inline unique constraint | 2 — equivalent uniqueness, different representation | Metadata now declares the existing named unique index `uq_user_invitations_share_token_hash`; no database change. |
| `users.password_reset_attempts`, `otp_attempts`, `security_version`, `totp_enabled`, `recovery_codes_hashes` server defaults | 3 — incomplete model metadata | Preserve existing historical database defaults and declare them in metadata (`0`, `0`, `0`, false, `[]`). No user-column migration. |
| Refund execution, immutable quotation snapshots/reapproval, physical file retention/deduplication | 4 — unresolved workflow requirements | Existing field declarations justify schema availability, not new business workflows. No new refund, approval, storage, purge or account-deletion behavior was invented. These operational requirements remain separate from schema reconciliation. |

Final unrestricted Alembic comparison: **zero differences**, with both `compare_type=True` and `compare_server_default=True`. This covers all 47 application tables, not selected samples. Full schemas before/after, drift lists and mapped relationships are preserved in verification evidence. Alembic reflection is not a proof of all SQLite features outside modeled schema; no additional modeled differences were detected.

## 3. Migration and SQLite execution policy

New revision: `e5c0a3b7f912_reconcile_application_schema.py`, parent `d4b9f2a6e801`. It adds the fields/indexes/constraints above and backfills quotation totals. It does not modify historical revisions, drop application columns, replace tokens, delete business records, or recreate the five T003 tables/FileAsset table. SQLite batch recreation of quotations and transactions preserves their rows. The new downgrade deliberately refuses destructive reversal; use a separately authorized verified backup restore with matching code instead.

SQLite batch recreation requires a controlled migration connection with FK enforcement disabled **before** entering the migration transaction. The new revision checks this before its first DDL statement and refuses unsafe execution. `tests/migration_support.py` verifies the absolute database target, rejects the live file/its hardlink aliases and the backup directory, runs migrations through a minimal Flask host, and checks integrity/FKs afterward. The application then reconnects with `foreign_keys=ON`.

This is not an instruction to change live connection settings. A normal app-factory `flask db upgrade` connection enforces FKs and will deliberately refuse this revision; a separately reviewed maintenance host/runbook is necessary for any future live execution. No FK violations are ignored. A regression verifies refusal leaves the pre-migration schema and revision unchanged.

## 4. Exact file changes

- `backend/app/models/quotation.py`: reciprocal items relationships/FK selection; matching server defaults for reconciliation fields.
- `backend/app/models/file_asset.py`: explicit uploader/deleter relationships and uploader alias; retained required RESTRICT FK and existing uniqueness/index definitions.
- `backend/app/models/user.py`: explicit file reciprocals/passive database deletion policy; align five existing authentication server defaults.
- `backend/app/models/event.py`: restore venue/location mappings; normalize SQLite deadline comparison to UTC.
- `backend/app/models/guest.py`, `invitation.py`: represent token uniqueness as the existing named indexes.
- `backend/app/models/__init__.py`: remove duplicate FileAsset import and export the class.
- `backend/app/api/guest_routes.py`: activate the newly issued token on authorized rotation; no response contract change.
- `backend/app/config/__init__.py`: disable automatic database initialization for testing.
- `backend/app/__init__.py`: reject unsafe test database targets before engine initialization; gate automatic create/stamp behavior on `AUTO_INIT_DATABASE`. Normal development behavior is unchanged.
- `backend/migrations/versions/e5c0a3b7f912_reconcile_application_schema.py`: reviewed forward reconciliation, early SQLite safety guard and no destructive downgrade.
- `backend/tests/migration_support.py`: verified disposable migration host and post-migration integrity/FK checks.
- `backend/tests/conftest.py`: build a session template from complete migrations; SQLite-consistent copy into a unique absolute database per test; isolated uploads; target/FK verification; integrity/FK assertions and connection disposal instead of `drop_all()`.
- `backend/tests/test_t004_orm_and_migrations.py`: mapper reciprocity, schema/default equivalence, unsafe target refusal, no implicit test initialization, SQLite deadline, migration guard, FileAsset ORM and populated legacy migration regressions.
- `backend/t004_verify.py`: repeatable read-only input/copy-only migration verification; full schema/relationship evidence, row preservation signatures and protected-file checks.
- This report: findings, inventory, commands, evidence and limits.

The existing user changes in `docs/api/authentication-api.md` were left untouched. T003's report, scripts and FileAsset migration remain preserved; the T003 baseline helper is a historical preflight tool and is not the entry point for the new graph. No configuration secrets or API contracts were changed.

## 5. Test isolation and migration evidence

Pytest's shared app fixture no longer calls `create_all()` or `drop_all()`. Its template is built by the real migration graph and backed up into each test's own file. Tests exercise migrated schema with FK enforcement enabled. Startup cannot silently create/stamp an empty testing database. The application testing guard rejects the original database, its existing hardlink aliases, backup paths, relative SQLite paths, URI query options and non-SQLite engines. The guard applies to testing mode; this is not a claim that arbitrary development startup is safe against an unprepared live database.

Read-only source: `D:\UTSAV\backend\instance\utsav_t003_iexh7zvl\rehearsal.db` at `d4b9f2a6e801`.

Final copy-only verification target: `D:\UTSAV\backend\instance\utsav_t004_verify_wj8byeen\verification-copy.db` at `e5c0a3b7f912`.

That run compared signatures and row counts for every pre-existing column of every application table before/after migration, finding no original-column/data changes. Integrity: `ok`; FK violations: zero. Both health routes return 200, and an unknown RSVP token now returns 404 rather than the T003 HTTP 500. Full evidence: `verification.json`, `schema-before.json`, `schema-after.json`, `migration.log` in the copy directory.

Separately, the legacy regression builds a **fresh disposable database at baseline** `91d2e7a4c631`, seeds controlled synthetic records and original plaintext guest/share tokens there, then upgrades through the full graph. Actual API requests verify active original token continuity, expired-token rejection, RSVP submission, later guest revocation and invitation unpublishing/revocation, invalid-token rejection, default attendee limit 21, and plaintext column removal. The same populated migration retains event venue/location, quotation items and their total, payment fields and historical transactions. No existing business records are used as test fixtures and no real files are uploaded.

## 6. Commands, results and failure history

Commands were run from `D:\UTSAV\backend` unless otherwise stated. All pytest directories were uniquely named and explicitly below the disposable T004 evidence directory.

1. `python -c "import sys; sys.path.insert(0,'backend'); import app.models; from sqlalchemy.orm import configure_mappers; from app.extensions import db; configure_mappers(); print('Configured',len(list(db.Model.registry.mappers)),'mappers')"` from repository root: **47 mappers configured**.
2. `python -m pytest tests/test_quotations.py tests/test_rsvp.py -q --tb=short --basetemp=instance/utsav_t004_kw718hd8/pytest-initial`: initial result **9 passed, 1 failed**. Existing regression `test_guest_invitation_token_expires_and_can_be_revoked` failed at `tests/test_rsvp.py:98`: reissued token lookup was 410, expected 200. That confirmed defect was fixed; assertions were unchanged. This first short traceback is recorded here; the first command's full console transcript was not saved as a separate file.
3. `python -m pytest tests -q --tb=long -p no:cacheprovider --basetemp=instance/utsav_t004_kw718hd8/pytest-full-1`: **79 passed** in 78.13 seconds after the rotation repair. Captured output: `pytest-full-1.log`.
4. `python -m pytest tests/test_t004_orm_and_migrations.py -q --tb=long -p no:cacheprovider --basetemp=instance/utsav_t004_kw718hd8/pytest-t004-final`: **10 passed** in 7.61 seconds, including the final early-refusal guard. Captured output: `pytest-t004-final.log`.
5. `python -m pytest tests -q --tb=long -p no:cacheprovider --basetemp=instance/utsav_t004_kw718hd8/pytest-verified --junitxml=instance/utsav_t004_kw718hd8/pytest-verified.xml`: **89 passed**, zero failures/errors/skips, in **78.99 seconds**, exit code 0. Complete output and machine-readable results: `pytest-verified.log`, `pytest-verified.xml`, `pytest-verified-result.json`. Eight warnings concern the existing `get_engine()` deprecation. Earlier combined run: 88 passed in 82.79 seconds (`pytest-final.log` / `pytest-final.xml`), before collecting the additional migration guard regression.
6. `python backend/t004_verify.py --source backend/instance/utsav_t003_iexh7zvl/rehearsal.db` from repository root: **PASS**, no drift including defaults, 47 mappers, old-column row signatures unchanged and protected files unchanged. The latest run's exact copy path is above.
7. `git diff --check`: passed.

Captured test logs redact long quoted token-like values. Test-generated tokens remain in isolated test database artifacts; treat those artifacts as private and do not publish copied database contents. No production token/credential values were printed. A verification helper initially left an Alembic logging handler pointing at a closed capture file; that capture-only error was corrected, and a clean copy verification was rerun. It was not an application or migration data failure.

All requested existing test groups are exercised: authentication/authorization, RSVP/invitations, workspace isolation, vendor authorization, quotations/payments, uploads, events, guests, admin, bookings and budget. New tests cover FileAsset ORM and controlled migration continuity. Health testing uses Flask's test client, not a network listener. No frontend/API contract change required a frontend build; none was run. External SMTP, payment-provider calls, infrastructure and live concurrency are not tested by this local backend suite.

## 7. Remaining security/data-integrity concerns

No known failing local mapper, modeled-schema, API or regression assertion remains in the verified scope. These limitations still matter before live execution:

- Repeat the full controlled rehearsal on a fresh recent source copy. T004's existing T003 copy is historical; controlled synthetic migration cases supplement it but cannot represent every real data distribution.
- The SQLite maintenance host must ensure all writers are stopped, target paths are checked, FK disabling occurs before transactions and integrity/FK checks pass before reconnecting. Normal application connections retain enforcement. The new migration refuses unsafe connection state.
- FileAsset still enforces global uniqueness of non-null checksums and still has redundant family/vendor indexes, as previously reviewed. Physical storage retention, file metadata integration, account deletion/reassignment and deduplication are not implemented by this repair.
- Refund fields and quotation history/approval/snapshot fields are structurally available; their dormant workflows are not implemented or certified here. Backfilled totals reflect existing line items, not reconstructed historical versions; snapshot `{}` does not invent approval evidence.
- The pre-existing migration environment emits Flask-SQLAlchemy `get_engine()` deprecation warnings. They do not fail tests; historical revisions were not changed to remove them.
- Read-only/hash checks demonstrate observed file preservation, not control over unrelated external processes. Backup ACL/encryption/expiry and actual deployment stop/start procedures still require operational review.
- No live migration is authorized by this report. The token-hashing downgrade remains unacceptable as a rollback; use verified backup recovery with compatible code under separate authorization.

## 8. Original database and backup preservation

Fresh T004 before/after evidence confirms unchanged original/backup hashes, sizes, modification timestamps, schema lists, version rows and PRAGMA results. The original still has zero Alembic version rows and 41 application tables plus `alembic_version`.

| Protected file | SHA-256 |
| --- | --- |
| `backend/instance/utsav.db` | `e57707a86311b42d0a8c0c76ccd02c1ba58bfa79b89a613b4c6bb86835068864` |
| `backend/instance/backups/utsav_pre_t002_20261113_083719.db` | `21fab206b7e5677e5106fd6e789fea03f9f13f779ae7ea9a6cc40f20a37464a7` |

Evidence root: `D:\UTSAV\backend\instance\utsav_t004_kw718hd8`; compare `safety-before.json` and `safety-final.json`. The independent copy verifier additionally checks its T003 input unchanged. All database artifacts/logs are preserved in ignored instance directories; existing backups were never overwritten or deleted.

## 9. Readiness recommendation

Ready for **another full disposable-copy migration rehearsal** with the repaired code and explicit target `e5c0a3b7f912`, including controlled legacy-token cases and the guarded SQLite migration host. This recommendation is not approval for live migration. Review the forward migration, operational host, backup/recovery procedure and rehearsal results before separately authorizing any live execution.
