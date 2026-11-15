# UTSAV T005 — Final end-to-end SQLite migration rehearsal

Final status: **READY AFTER SPECIFIC FIXES**.

The fresh-copy database and application rehearsal passed: **97 backend tests passed**, zero failures/errors/skips; frontend production build passed; **47 mappers** configured; **zero unrestricted schema differences including server defaults**; all existing business rows and retained column signatures preserved; integrity `ok` and zero FK violations. The original database and existing backup remain unchanged.

The remaining prerequisites are operational: identify and verify every writer's maintenance stop/start procedure, and archive a reviewed deployment release plus a demonstrated baseline-compatible rollback release. The current HEAD-dependent application cannot simply be restarted on a restored baseline database. Neither deployed service identities nor such a rollback release are established by this workspace. These are specific readiness gaps, not failing local migration/tests. **No live migration, replacement or restore is authorized or executed by T005.**

Performed on 14 November 2026. The user explicitly approved repairing the revocation issue with an owner-only reissue action during T005.

## 1. Migration graph and source verification

Actual repository graph verified, with a single final HEAD `e5c0a3b7f912`:

```text
91d2e7a4c631 ── 2a9c5e1f7b40 ── 4f2c8a9d1e63 ──┐
       └────── a43c91dbe827 ──────────────────────┴── c8d4a9f1e270
       → 0c8e7f1a2b34 → d4b9f2a6e801 → e5c0a3b7f912
```

The merge has parents `a43c91dbe827` and `4f2c8a9d1e63`. All ancestors of the baseline were also used to build an independent reference database. No historical revision was modified, no new schema revision was needed, and no downgrade was run.

`configure_mappers()` configured all 47 registered SQLAlchemy models. The reconciliation revision's SQLite guard was inspected: it refuses FK-enabled connections before its first DDL statement. The maintenance host verifies every opened connection's absolute path and establishes `foreign_keys=OFF` before transactions, then restores/checks enforcement and integrity after migration. Application connections independently verify `foreign_keys=ON`.

Git base: `87d63d3d346fc84d633c35f72645f41595bfda36`. The working tree contains the prior T003/T004 work and these T005 changes; it is not represented by that commit alone. `working-tree.txt` and SHA-256 hashes of application/model, migration and test Python files are recorded in `rehearsal.json`. Final comparison confirmed the latest manifest unchanged. Archive the reviewed working-tree content with the release; deploying only the Git base would omit the repairs.

T005 changes are limited to:

- `backend/app/api/guest_routes.py`: preserve revocation on ordinary rotation; add explicit owner-only reissue and its distinct audit event.
- `backend/tests/test_rsvp.py`: strengthen revoked-rotation assertions and require explicit reissue before a new token becomes active.
- `backend/tests/test_t004_orm_and_migrations.py`: strengthen populated baseline migration coverage with family membership, function, RSVP, booking, attendance-limit and rotation/reissue checks.
- `backend/tests/test_payments.py`: additionally assert repeated signed webhook processing leaves one transaction.
- `backend/tests/test_t005_invitation_security.py`: owner/delegated/tenant-context authorization, audit secrecy, active-state reissue refusal, refund field and quotation revision round-trip/FK tests.
- `backend/t005_rehearsal.py`: reusable copy-only end-to-end host, complete schema/data signatures, private evidence directory and restore staging. It has no live-target option.
- `docs/api/guest-invitation-tokens.md` and this report: approved lifecycle contract and rehearsal/runbook evidence.

Existing user changes in `docs/api/authentication-api.md` were not edited. No original application connection configuration, engine selection or production secrets were changed.

## 2. Original database and backup safety

Original: `D:\UTSAV\backend\instance\utsav.db`.

Existing backup: `D:\UTSAV\backend\instance\backups\utsav_pre_t002_20261113_083719.db`.

| Evidence | Original, before and after | Existing backup, before and after |
| --- | --- | --- |
| SHA-256 | `e57707a86311b42d0a8c0c76ccd02c1ba58bfa79b89a613b4c6bb86835068864` | `21fab206b7e5677e5106fd6e789fea03f9f13f779ae7ea9a6cc40f20a37464a7` |
| Size | 700,416 bytes | 700,416 bytes |
| Modification time, Unix nanoseconds | `1794535861310146700` | `1794539239745416600` |
| Application tables | 41 | 41 |
| Alembic version rows | zero | zero |
| Integrity | `ok` | `ok` |
| Foreign-key violations | zero | zero |
| Journal mode | `delete` | `delete` |
| Observed WAL/SHM/journal sidecars | none | none |

Both files were opened only through read-only SQLite connections for inspection/backup input. The normal Flask app factory was never pointed at either protected file. Their complete schemas and evidence were rechecked after the final tests/build. `safety-final.json` confirms equality to T005 starting evidence, including timestamps and hashes. Different original/backup hashes were retained as separate historical snapshots, not assumed equivalent.

## 3. Fresh disposable database and privacy

Final full-chain target:

`D:\UTSAV\backend\instance\utsav_t005_vc3zcmw8\rehearsal.db`

Created freshly from the **current original** using SQLite's backup API, not reused from T003/T004. Its schema initially equaled the source; integrity and FK checks passed. The private directory has inheritance removed and full access limited to the current sandbox account, SYSTEM, Administrators and owner rights. ACL evidence: `directory-acl.txt`. It is under the ignored instance directory and is not a public upload directory.

The earlier T005 run and regression/build logs are preserved separately under:

`D:\UTSAV\backend\instance\utsav_t005_30xyfgob`

All migration connections stayed in their own private T005 directory. Each target was printed before migration, every connection was checked, protected files/hardlink aliases were rejected, and no existing file was overwritten. The app factory was used only with explicit testing overrides, automatic initialization disabled and a checked copy path. The final real-source copy received only read-only health requests; synthetic API mutations occurred exclusively in isolated regression databases.

## 4. Complete baseline comparison

PASS. Built `baseline-reference.db` independently by executing all historical migrations from base to `91d2e7a4c631`. Compared all 41 application tables and every reflected column/type/nullability/default, primary key, FK/options, unique constraint, index and check constraint. Alembic's own version table was verified separately.

`baseline-comparison.json` contains complete expected/actual schemas and `pass: true`. `source-schema.json` records the source schema; `baseline-build.log` records reference creation. Only after that comparison passed was the copy stamped. The post-stamp row was verified as exactly `91d2e7a4c631`.

## 5. Full migration execution

Exact rehearsal command from repository root:

```powershell
python backend/t005_rehearsal.py
```

The copy-only maintenance host called Flask-Migrate `stamp(..., revision="91d2e7a4c631")`, then `upgrade(..., revision="e5c0a3b7f912")`, with an explicit migration directory and path-verified engine. It does not invoke the default `run.py` app. FK maintenance state was set before any migration transaction, and normal enforcement restored/verified afterward.

Full stamp/upgrade output: `backend/instance/utsav_t005_vc3zcmw8/full-migration.log`. It records both branch upgrades, their merge, token hashing, FileAsset creation and reconciliation:

```text
stamp → 91d2e7a4c631
91d2e7a4c631 → 2a9c5e1f7b40 → 4f2c8a9d1e63
91d2e7a4c631 → a43c91dbe827
a43c91dbe827, 4f2c8a9d1e63 → c8d4a9f1e270
c8d4a9f1e270 → 0c8e7f1a2b34 → d4b9f2a6e801 → e5c0a3b7f912
```

No migration errors occurred. Failed-copy destructive cleanup and downgrade were unnecessary and were not attempted.

## 6. Final revision and schema

Final version row: exactly `e5c0a3b7f912`. Final schema: 47 application tables plus `alembic_version`. Unrestricted Alembic comparison with `compare_type=True` and `compare_server_default=True`: **zero differences**. No table/object filters or difference suppression are used in this verification.

The six added application tables are `revoked_tokens`, `planner_profiles`, `planner_assignments`, `user_sessions`, `security_events`, and `file_assets`. Security/token fields, FileAsset columns and constraints, event deadline/venue/location, refund fields, quotation revision/self-FK/defaults and transaction provider-event uniqueness all match metadata. Plaintext guest/share-token columns are absent. Full reflected final columns, indexes, unique constraints, FKs and defaults are in `final-schema.json`.

Final integrity: `ok`. FK violations: zero. Both health routes return 200 on the final copy with FK enforcement enabled.

## 7. Data preservation and limits of the real dataset

Deterministic per-table signatures compare every retained original column across all 41 original application tables. Rows are serialized deterministically and sorted before hashing; table counts and compared column names are recorded, without exposing individual records. Only the two explicitly removed plaintext token columns are excluded from retained-column signatures and checked through separate token transformation logic.

| Business group | Before | After |
| --- | --- | --- |
| Users | 1 | 1 |
| Family workspaces | 1 | 1 |
| Family memberships | 1 | 1 |
| Events/functions | 0 / 0 | 0 / 0 |
| Guests/RSVPs | 0 / 0 | 0 / 0 |
| Vendor profiles/memberships | 0 / 0 | 0 / 0 |
| Quotations/line items | 0 / 0 | 0 / 0 |
| Bookings/payments/transactions | 0 / 0 / 0 | 0 / 0 / 0 |
| Other original application tables | 0 each | 0 each |

All original counts and retained-column signatures match. All six new tables are empty in the final fresh-copy run. Version-table stamping is the intended metadata transformation, not a business-record change. `data-before.json`, `data-after.json` and `rehearsal.json` contain the complete comparison.

The migration code also verifies guest/share-token hashes against original nonempty tokens, absence of old columns, default guest attendee limits and quotation totals against old line-item sums. In this real snapshot those checks have zero guest/invitation/quotation rows. Their populated behavior is therefore established separately with synthetic fixtures, not claimed from empty tables.

## 8. Legacy invitation and reissue security

The populated migration regression creates a separate synthetic database at `91d2e7a4c631`. It seeds family ownership/membership, an event/function, active/expired guests and invitations, an existing RSVP, vendor, quotation/line item, booking, payment and transaction. Tokens are generated with `secrets`, retained in process memory for verification and present only in the old synthetic schema until migration; no plaintext token file/report is emitted. The database upgrades through the entire chain to the explicit final schema.

Verified through actual Flask endpoints and ORM/database assertions:

- Original active guest/share tokens still work; expired tokens return 410; unknown tokens return 404.
- RSVP submission succeeds within the limit; over-limit submission is rejected. Migrated guest limit defaults to 21 and can be enforced at a smaller configured value.
- Revoked guest access returns 410; revoked/unpublished share access is rejected; old plaintext columns are absent.
- Rotation invalidates the old token. **Ordinary rotation preserves deliberate revocation**, including when done by a delegated editor with `guest.update`.
- Explicit `POST /guests/<id>/invitation-token/reissue` reactivates only a revoked invitation, and only for its event's owning family account with a real family workspace and valid server-side event/membership context.
- Delegated editor reissue is 403; viewers, inactive memberships, other tenants and an owner using the wrong membership context are denied by the scope check (404). Unauthenticated reissue is 401. Reissue of an already active invitation is 409 without changing its hash/expiry.
- Owner reissue creates a new hash/expiry, clears revocation, invalidates earlier tokens and emits `guest.invitation_reissued`; tokens are absent from audit metadata.
- Existing synthetic function, RSVP note, booking, payment/transaction and line items survive migration; quotation total backfill is 25.00 for the seeded 2 × 12.50 case.

This intentionally corrects T004's rotation policy with the user's explicit approval. The old test assertion expecting rotation to reactivate a revoked link was replaced with **stronger** assertions for preserved revocation and explicit reissue; no test was skipped or weakened. API response shape remains `guestId`, `invitationToken`, `expiresAt`; the new action and tightened rotation behavior are documented in `docs/api/guest-invitation-tokens.md`. No frontend reissue control was added; API clients needing reactivation must adopt that explicit action.

## 9. Full regression/build results

From `D:\UTSAV\backend`:

```powershell
python -m pytest tests -q --tb=long -p no:cacheprovider --basetemp=instance/utsav_t005_30xyfgob/pytest-full --junitxml=instance/utsav_t005_30xyfgob/pytest-full.xml
```

Result: **97 passed in 85.72 seconds**, exit 0; zero failures/errors/skips. Full output: `pytest-full.log`; machine results: `pytest-full.xml`, `pytest-result.json`. Eight warnings concern the existing migration environment's deprecated `get_engine()` call. No T005 migration/test failure traceback was generated.

The 25-test focused run passed before the final full suite. Coverage includes authentication/registration, roles, tenant/workspace isolation, invitations/RSVP, vendor authorization, quotations, bookings/payments, refunds/revision field persistence, provider-scoped event-ID uniqueness, repeated signed webhook processing, FileAsset ORM/deletion restrictions, health and errors. Tests build an isolated migrated template and copy it per test; no original DB or `drop_all()` teardown is involved. Refund/revision field round-trips do not claim unimplemented refund execution or approval workflow coverage. Sequential webhook replay is tested; concurrent/external-provider exactly-once behavior is not proven.

From `D:\UTSAV\frontend`, `npm.cmd run build`: **PASS**, TypeScript and Vite production build successful. Output: `frontend-build.log` in the regression evidence directory. No frontend source or dependency configuration was changed. `git diff --check` also passed.

## 10. Backup/restore staging and recovery readiness

The final fresh-copy run created, without overwriting any existing file:

1. `fresh-pre-migration-backup.db`: a SQLite-consistent pre-migration snapshot.
2. `baseline-restore-stage.db`: an independent restoration of that snapshot; its full baseline schema and original-column row signatures match, integrity `ok`, FKs clean.
3. `final-restore-stage.db`: an independent restoration of the fully migrated copy; its complete final schema and row signatures match, integrity `ok`, FKs clean.

These demonstrate database restoration/staging, not a live restore or startup of a known baseline-compatible rollback release. The current app was health-tested on the migrated copy; it must not be started on the baseline restore merely because that file passes integrity checks.

Additionally, `cutover-simulation/` contains a same-volume Windows cutover and rollback simulation using `System.IO.File.Replace`. All absolute paths were checked to remain inside that private simulation directory. A baseline clone was replaced by a migrated clone, preserving a unique baseline backup; a separate baseline restore clone then replaced it, preserving the migrated file. Full schema, row-signature, integrity and FK checks passed for the replacement and both preserved versions. Evidence: `cutover-simulation/cutover-result.json` and `final-result.json`. No original/backup path was a replacement target. This validates the file-operation mechanics on the current D: volume, not deployed service shutdown, application-account ACLs or baseline application compatibility.

For operational readiness, first identify the actual web service/process, workers, schedulers, reloaders and auto-restart mechanisms. Record service names/PIDs and stop/start commands in the approved maintenance ticket. Stop the named services/jobs, prevent automatic restart, and establish an exclusive-open check plus stable source evidence before creating the frozen deployment snapshot. A quiet HTTP endpoint or a database hash alone does not prove there are no writers. This workspace exposes development/WSGI entry points, not a verified inventory of the deployed writers.

If migration fails, retain the failing stage, all logs and any SQLite sidecars in a new private incident directory. Do not downgrade or retry destructively. With staged cutover, the live file remains unchanged until the final separately authorized replacement. If cutover already occurred, stop all writers and stage restoration from the verified pre-migration snapshot, validate its schema/revision/data and restart only the matching rollback release.

The token downgrade is unacceptable: SHA-256 cannot reconstruct original bearer tokens; the downgrade fabricates fresh ones and invalidates historical links. Backups/copied databases may still contain old plaintext tokens and private records despite `secure_delete=ON` during migration. Apply private ACLs, encryption where supported, retention/expiry and controlled access; never expose evidence directories through uploads/static hosting. No existing backup was overwritten or deleted.

SQLite WAL/journal safety: the exact profile tested here is DELETE journal mode with no sidecars. A WAL file can contain committed data absent from the main DB; never discard it independently or copy a busy `.db` with ordinary file-copy semantics. Use SQLite backup for a consistent snapshot. Preserve a failed DB together with its related WAL/SHM/journal files after writers stop. Never attach stale sidecars to a replacement DB. If sidecars or journal mode differ at cutover, stop and review a matching checkpoint/recovery procedure; do not force this tested no-sidecar procedure onto a different state.

## 11. Remaining prerequisites and risks

Before the final status can become `READY FOR SEPARATELY AUTHORIZED LIVE MIGRATION`:

1. **Writer inventory:** identify actual deployment/service/job identities and verify the stop/no-writer/start procedure. No broad process-kill command should be substituted for that inventory.
2. **Release/recovery pairing:** archive the exact reviewed repaired source plus dependency/configuration references and a proven baseline-compatible rollback release. Validate the latter against `baseline-restore-stage.db` in an isolated environment. A baseline DB restore plus the current application is not a complete recovery plan.

No local schema, mapper or regression blocker remains. Additional limits: the real business dataset is sparse; synthetic fixtures cannot prove every production data distribution. Live locking, crash/power loss, storage exhaustion, service configuration, SMTP, real payment-provider operations and deployment proxy behavior were not tested. Global FileAsset checksum uniqueness, redundant indexes and unimplemented physical retention/deduplication workflows remain as previously reported. No extra business features were inferred from the availability of schema fields.

## 12. Reviewed live-execution procedure — not executed

The reviewed approach is **migrate a fresh frozen stage, then cut over the database file**, rather than invoke the normal app factory against the unstamped original. It uses the exact copy-only migration host tested in T005; there is no moving-head or live-target option. Deployment-file replacement still modifies live state and requires a new explicit authorization task. Do not reuse today's rehearsal copy as a deployment artifact.

1. Complete the two prerequisites above and obtain separate authorization covering the maintenance window, release, staged replacement and recovery procedure. Require the reviewed final revision `e5c0a3b7f912` and archived source manifest; stop if code, graph or configuration differs. Preserve all existing backups.
2. Stop every inventoried writer/job and disable its restart mechanism. Verify their stopped state. On Windows, the following **future, separately authorized** exclusive-open probe must succeed while the services remain stopped; it reads without writing bytes:

   ```powershell
   $live = 'D:\UTSAV\backend\instance\utsav.db'
   $probe = [System.IO.File]::Open($live, [System.IO.FileMode]::Open, [System.IO.FileAccess]::Read, [System.IO.FileShare]::None)
   $probe.Dispose()
   ```

   A momentary probe alone does not prevent a later restart; service/job shutdown is mandatory. Record read-only live hash/size/mtime/schema/version/integrity/FKs and require DELETE mode with no sidecars for this reviewed cutover variant. If the baseline no longer matches or versions are nonempty, stop and reassess rather than force-stamp.
3. From the pinned repository, run `python backend/t005_rehearsal.py` **only after writers are stopped**. It creates a new private directory, fresh pre-migration backup and independently validated restore stages. It performs the full baseline comparison, stamps only its copy at `91d2e7a4c631`, upgrades that copy explicitly to `e5c0a3b7f912` with the tested FK maintenance sequence, and requires zero schema differences/integrity/FK errors and matching original business signatures. Archive `full-migration.log`, `rehearsal.json` and the new pre-migration backup. Run controlled API regressions on separate synthetic databases, never by inserting demo records into the deployment stage.
4. Verify the fresh stage's current hash against its final evidence, final schema/revision, FK checks, row signatures and release manifest. Require the live file's hash, size, mtime and sidecar state still match that run's preflight. Obtain a final exclusive-open probe with services still disabled. Any changed source or active writer is a stop condition.
5. Select **that new run's** `final-restore-stage.db` as the cutover file; it is independently verified and contains no synthetic business/audit additions from T005 health testing. Resolve it and the live/backup paths to absolute paths on the same volume. Create a new private incident/cutover directory and a unique nonexisting backup pathname. Recheck no sidecars. Under the new authorization, perform the single replacement operation below, after filling the two exact paths from the approved ticket:

   ```powershell
   $staged = '<new private T005 directory>\final-restore-stage.db'
   $previous = '<new private cutover directory>\utsav_before_cutover.db'
   if (-not [System.IO.File]::Exists($staged)) { throw 'Missing verified stage' }
   if ([System.IO.File]::Exists($previous)) { throw 'Refusing to overwrite a backup' }
   [System.IO.File]::Replace($staged, $live, $previous)
   ```

   This future live operation consumes the staged pathname and preserves the prior live main file at the unique backup path. It was **not run against live** during T005. Its mechanics and reverse operation passed the private same-volume simulation described above. Verify deployed service-account permissions before authorization; rerun the simulation if the deployment volume/filesystem differs from this D: environment. If any precondition differs, do not substitute an unreviewed copy/move operation.
6. Keep writers stopped while read-only verification confirms the replacement's exact schema/revision, expected signatures, integrity and FKs. Apply/recheck the intended application-account ACLs without exposing historical snapshots. Start only the archived repaired release with normal FK enforcement enabled. Verify health and authorized read-only business flows, then resume jobs in the approved order and monitor.
7. If any stage fails, keep writers stopped and preserve all failed files/logs/sidecars. Before cutover the original still exists untouched. After cutover, stage recovery from the verified pre-migration backup, verify baseline schema/data and the demonstrated rollback release, then separately authorize replacement/restoration. Never execute the token migration downgrade. The stage-and-cutover plan does not license a live restore during T005.

This runbook is concrete about the tested migration/SQLite/cutover sequence and explicit about the remaining deployment and rollback-release facts. Those readiness gaps explain the final `READY AFTER SPECIFIC FIXES` status. No claim of unconditional production safety is made.
