# UTSAV T007 — Controlled live migration plan and Phase A/B report

Status: **PREPARED – AWAITING AUTHORIZATION**.

**Phase C: NOT EXECUTED.** Submitting T007 was not authorization to stop writers, migrate/replace the live file or activate a release. This document is the exact plan submitted for approval. Fresh backups, frozen-stage migration, live replacement, live startup and existing-account acceptance remain pending.

Scope: the inspected **local Windows installation at `D:\UTSAV`**, not a remote/cloud deployment. No accessible configuration or inventoried process established a remote deployment; no assertion is made about unobserved environments. If another deployment exists, it needs its own inventory and plan.

## 1. Phase A evidence

Evidence directory: `D:\UTSAV\backend\instance\utsav_t007_s5tg96dw`.

### Environment and writers

The final preparation inventory at **18:18:20 IST on 14 November 2026** identifies:

| Process | Parent | Started UTC | Identity and role |
| --- | --- | --- | --- |
| Python **4492** | PowerShell **4720** | `2026-11-14T11:49:49.2699760Z` | `run.py`, original DB owner; listener `127.0.0.1:5000` |
| Python **7340** | Python **4492** | `2026-11-14T12:43:55.4870120Z` | Current `run.py` reloader child; original DB owner |
| Node **13840** → cmd **24736** → Vite **14692** → esbuild **28656** | Frontend terminal **23000** | Recorded in inventory | Vite listens on `[::1]:5173`; none reported as DB owners |

The backend runtime account is **`PARSHVANATH\Parsh`**, confirmed through CIM owner queries. Executable: `C:\Users\Parsh\AppData\Local\Programs\Python\Python314\python.exe`. Restart Manager confirms both processes hold the **exact original DB**, rather than inferring ownership from a process name. No matching production WSGI service, worker, scheduled task or startup entry was found among 334 processes, 292 services and 213 tasks in the final sample. The earlier T007 child 13472 was replaced while the reloader remained active. The observed deployment is Flask/Vite development serving.

Earlier child PIDs are obsolete. Refresh identities, start times, parentage and file ownership immediately before any shutdown; this snapshot is not a reusable kill list. The parent/reloader must stop as well as the child. No stop/start command has been executed. See `writer-inventory.json`, `runtime-accounts.json` and the existing [T006 maintenance runbook](deployment/t006-windows-maintenance.md).

### Protected database and historical backup

Original: **`D:\UTSAV\backend\instance\utsav.db`**.

| Check | Original | Historical backup |
| --- | --- | --- |
| Path suffix | `instance\utsav.db` | `instance\backups\utsav_pre_t002_20261113_083719.db` |
| Size | 700,416 bytes | 700,416 bytes |
| SHA-256 | `e57707a86311b42d0a8c0c76ccd02c1ba58bfa79b89a613b4c6bb86835068864` | `21fab206b7e5677e5106fd6e789fea03f9f13f779ae7ea9a6cc40f20a37464a7` |
| Modification time, Unix ns | `1794535861310146700` | `1794539239745416600` |
| Tables | 41 application + `alembic_version` | 41 application + `alembic_version` |
| Alembic rows | empty | empty |
| Integrity / FK violations | `ok` / 0 | `ok` / 0 |
| Journal / sidecars | DELETE / none | DELETE / none |

The original was opened read-only. `preflight-database.json` records the SQLite runtime version, all tables, row counts, hashes and timestamps; `original-schema.json` records the complete schema. Counts are one user, one family workspace and one family membership; all other business tables are empty. `business-signatures.json` records deterministic per-table signatures without publishing row values.

Complete baseline comparison **PASS** against the independent historical `91d2e7a4c631` reference. All application tables/columns/types/nullability, PKs, FKs/options, unique constraints, indexes, server defaults and checks match. The reference was itself checked against T005's recorded expected schema. No stamp was applied to the original or to the T007 smoke databases. Full evidence: `baseline-comparison.json`.

The original and instance directory are owned by `Parshvanath\Parsh`; the runtime account has required access. Existing ACLs also grant broader local groups access, including Authenticated Users modify rights. This is an existing privacy/concurrency risk, not a new permission grant. The proposed cutover **preserves existing live ACLs**, verifies the runtime account's access, and uses restricted new backup/evidence directories. Broad live-directory ACL hardening is not included in this approval request; do not silently change it or recursively alter old backups. `acl-preflight.json` records the current SDDL for comparison.

### Reviewed graph, source and release compatibility

Single actual reviewed HEAD: **`e5c0a3b7f912`**. Verified chain: baseline `91d2e7a4c631`, both existing branches and merge `c8d4a9f1e270`, token migration `0c8e7f1a2b34`, FileAsset `d4b9f2a6e801`, reconciliation `e5c0a3b7f912`. No historical migration changed. `migration-graph.json` contains the full graph.

Private release root: `D:\UTSAV\backend\instance\utsav_t005_9k3sem3q`.

| Pair | Approved archive | Verified SHA-256 |
| --- | --- | --- |
| Repaired + final schema | `utsav-repaired-t005-verified.zip` | `4d0863d42f408c80e55d5e2c0541b9566d0b4d2cf7d3168809d09fe0f6175d38` |
| Historical + baseline | `utsav-baseline-rollback-21b4dd72.zip` | `06304430645053e796b972a5218444c0a8a47ed6282b83ccac20458238b167c1` |

Both exact supplied hashes and manifests were rechecked. Relevant current backend/application/migration/test files, the copy-only host/helpers and frontend source/configuration/locks match the verified repaired manifest. Additional T006 preparation tooling and documentation are not mistaken for application release changes. The rejected earlier ZIP is excluded.

Both release/database pairings were rerun on **fresh private copies**, with synthetic records only in those copies:

- Repaired release: **47 mappers**, zero unrestricted schema/default differences, correct final revision, startup/health, login, workspace and populated event/quotation/booking/payment reads pass; wrong password rejected; schema unchanged; integrity `ok`, FKs clean.
- Rollback commit **`21b4dd72f1808992696ec4307d47ed21b5abc40d`**: **41 mappers**, exact baseline schema including defaults, the same appropriate smoke checks pass, schema and originally empty version rows unchanged; integrity `ok`, FKs clean.

Results are `repaired-pairing.json` / `rollback-pairing.json` and captured logs. These are not tests of the original database or its existing account. The historical rollback has a matching archived frontend/backend contract; do not pair its backend with the current frontend.

The isolated interpreter and 44 pinned dependencies are available; `pip check` passes. T006's full 97-test archive run and T005 frontend build are historical evidence with matching application/source hashes, not newly claimed T007 full-suite runs. Private configuration exists and required Flask/JWT secret settings are present; their values were not emitted. The development rate limiter uses memory. No active frontend `.env` override was found; reviewed source defaults to `http://localhost:5000/api/v1`, consistent with the local backend. Existing frontend source hashes match the repaired archive.

## 2. Exact Phase B execution plan submitted for approval

### Window, scope and operator participation

- **Proposed window:** one 30-minute maintenance window beginning after explicit approval and a fresh final preflight. It is not scheduled or started by this report.
- **Expected backend downtime:** approximately 10–20 minutes; 30 minutes reserved. If safe completion requires more time, pause/report rather than silently extend scope. No downtime guarantee is implied.
- **Target:** only `D:\UTSAV\backend\instance\utsav.db`; SQLite remains the engine and port 5000 remains the backend port.
- **Deployment:** verified repaired archive/extracted source and pinned isolated interpreter; exact final revision `e5c0a3b7f912`. The matching, hash-verified local Vite frontend may remain running, with source frozen and no user actions until acceptance. Its API calls cannot write once the backend is stopped.
- **Operator:** be available in the original Parsh backend terminal for graceful Ctrl+C and later the explicit launch command below. Be available to sign in through the normal UI using an authorized existing account. Never paste passwords, OTPs, cookies or bearer tokens into this conversation.

### C1 — Freeze and stop writers

1. Recheck approved archive/source/dependency hashes, current original evidence and exact reviewed HEAD. Stop/review any unexpected source, schema, journal, ownership or data change. Freeze editing and user activity for the window.
2. Rerun the read-only inventory:

   ```powershell
   Set-Location -LiteralPath 'D:\UTSAV'
   & '.\backend\t006_inventory.ps1' -OutputDirectory 'D:\UTSAV\backend\instance\utsav_t007_s5tg96dw' -NoWrite
   ```

3. Drain requests and have the operator press **Ctrl+C in backend terminal 4720**, after confirming it is still the verified backend terminal. Verify both current parent/reloader and child stop. Do not target historical child IDs or terminate the terminal/VS Code/unrelated processes.
4. If graceful stopping fails, **stop and report**. This approval request does not silently authorize an abrupt `Stop-Process` fallback; obtain a specific revised stop authorization if needed.
5. Require no SQLite file owners, no replacement reloader child and no backend listener. No matching services/tasks exist to disable. Perform the reviewed read-only exclusive-open probe while restart/source editing remain suppressed. Recheck DELETE mode and absence of WAL/SHM/journal files. Abort if any owner, unexpected sidecar or new writer appears.

### C2 — Fresh backup and restoration proof

Create a new private directory under `backend\instance\backups` with a UTC timestamp and random suffix, for example `t007_<UTC>_<unique>`. The resolved directory must be within that intended backup root; refuse collisions. This is a proposed naming pattern, **not a backup already created**.

Use SQLite's backup API from the frozen original read-only into `pre_migration.db`, then from that backup into a separate `baseline_restore_stage.db`. Verify both against the frozen source: integrity, FK check, complete schema, all table counts and deterministic signatures, version rows, size/hash and recovery timestamp. Preserve the existing historical backup untouched. No ordinary copy of an active DB is permitted; no migration begins if restoration proof fails.

### C3 — Fresh frozen migration stage

Use the exact reviewed host and pinned interpreter. Its source is location-bound: `ROOT` is its script directory. Therefore run the **manifest-matched host at `D:\UTSAV\backend\t005_rehearsal.py`**, not a relocated archive copy whose `instance` path would point somewhere else. All imported application/migration sources at this path must still match the approved repaired manifest; otherwise stop. No script/path constant is rewritten to force a target.

The explicit isolated invocation is:

```powershell
$runtime = 'D:\UTSAV\backend\instance\utsav_t005_9k3sem3q\isolated-python\Scripts\python.exe'
$runner = @'
import runpy, sys
sys.path.insert(0, "D:/UTSAV/backend")
runpy.run_path("D:/UTSAV/backend/t005_rehearsal.py", run_name="__main__")
'@
$runner | & $runtime -I -
```

This is the reviewed copy-only host in the verified repaired source environment. It reads the original, creates a **new** private stage, compares the full baseline, stamps only its copy at `91d2e7a4c631` and upgrades it explicitly to `e5c0a3b7f912`, with FK maintenance established before transactions and checked afterward. It also makes its own fresh backup and independent restore stages. Capture the new generated paths and complete logs. Do not select any old T005/T006/T007 smoke DB as the deployment artifact.

### C4 — Stage acceptance

Require exact final revision, 47 application tables plus version table, zero unrestricted schema differences including defaults, complete indexes/constraints/FKs, integrity `ok`, zero violations, and FK enforcement enabled on normal application connections. Check all original counts/retained-column signatures, token hashing/plaintext removal, guest attendee defaults and quotation total backfills. The real data is sparse; mutation-based API checks use separate synthetic DBs, never the deployment stage. Stage health requests must not add fake audit/business records.

### C5/C6 — Final preconditions and cutover

1. With writers still stopped, recheck original hash, size, modification time, schema/revision and sidecars against the frozen snapshot; confirm no new file owner or listener. Refresh the exclusive-open probe. Source changes are a stop condition, not something to overwrite.
2. Verify the new run's `final-restore-stage.db` hash/schema/signatures, archive/source manifest and the fresh baseline backup/rollback archive accessibility. Verify stage/live/backup paths resolve onto supported same volume **D:** and all paths remain in their intended directories.
3. Preserve current live file/directory SDDL in evidence; require the runtime Parsh account and maintenance account retain required access. Verify replacement ACL behavior on a disposable simulation with the current permission profile before touching live. If ACL transfer or permissions differ from the reviewed procedure, stop for review; no broad live ACL hardening or recursive changes are authorized by this plan.
4. Reserve a new private cutover directory with a **nonexisting** `previous_live.db` filename. Its parent directory must exist, but the file must not be precreated or reused. This resolves the distinction between reserving a backup pathname and overwriting an existing backup.
5. Execute only the tested same-volume Windows operation, after all gates pass:

   ```powershell
   # These two paths are populated from the NEW authorized run, then validated.
   $stage = '<new frozen run>\final-restore-stage.db'
   $previous = '<new private cutover directory>\previous_live.db'
   $live = 'D:\UTSAV\backend\instance\utsav.db'
   if (-not [System.IO.File]::Exists($stage)) { throw 'Missing verified stage' }
   if ([System.IO.File]::Exists($previous)) { throw 'Refusing backup overwrite' }
   [System.IO.File]::Replace($stage, $live, $previous)
   ```

The single replacement preserves the previous main DB at the fresh private pathname and consumes the staged pathname. No Alembic operation targets live; no downgrade, raw-copy-over-live or alternative replacement method is permitted. Keep writers stopped until read-only post-replacement schema, signatures, integrity/FKs, revision and ACL checks pass.

### C7 — Activate the verified repaired backend

The prepared launch file is:

`D:\UTSAV\backend\instance\utsav_t007_s5tg96dw\launch_repaired.py`.

It was syntax-checked, **not executed**. It validates the fixed archive hash and extracted release manifest, requires runtime account `PARSHVANATH\Parsh`, checks the live revision is exactly `e5c0a3b7f912` before factory startup, loads the existing private configuration without printing it, binds the explicit original SQLite path, disables automatic initialization/debug/reload and verifies normal FK enforcement. It imports only the verified repaired extracted backend. Its digest is recorded in `launch-script-review.json` and must be checked before execution.

After approval, cutover and successful gates, the operator runs in the **Parsh** terminal:

```powershell
& 'D:\UTSAV\backend\instance\utsav_t005_9k3sem3q\isolated-python\Scripts\python.exe' -I 'D:\UTSAV\backend\instance\utsav_t007_s5tg96dw\launch_repaired.py'
```

This retains the actual runtime account and avoids silently launching under a sandbox/service identity. No new production service is invented. The reviewed Vite source/API target remains frozen; verify its matching frontend hash before user acceptance. No secret is copied into an archive or written into a launch command.

### C8 — Post-cutover acceptance

Check `/health` and `/api/v1/health` return 200; verify the process/listener is the approved non-reloader release. The operator signs into the normal UI with the authorized **existing account**, completing OTP/MFA if required. Observe login success, correct `/auth/me` identity and real workspace membership, without printing private identity details, credentials or tokens. Do not mint a token for the user, reset their password, create a synthetic account or fake a successful login.

Using that normal authenticated session, verify event/function, guest/invitation, vendor/quotation, booking/payment and workspace reads against their real recorded counts; empty lists are expected where the frozen source has no rows. Verify cross-workspace denial/tenant checks with the existing session where valid; broader actor-based mutation tests remain on synthetic DBs. Do not create accounts/tenants just to produce live test coverage. Record limitations honestly.

Normal sign-in may create legitimate technical session/security-audit records; those are expected authentication effects, not demo business data. Original user/profile/workspace/business values must remain unchanged except the reviewed migration transformations. Recheck deterministic signatures for original business columns, final version, integrity, FKs, sidecars and critical mapper/SQL errors. Logs stay private; report status codes and verification booleans rather than secrets or records.

If the operator cannot complete the real account sign-in, report acceptance as pending/failed; do not claim `COMPLETED – LIVE MIGRATION VERIFIED` from health checks or synthetic logins alone.

### C9 — Failure and recovery decision

Before cutover, a failed gate leaves the original untouched; preserve the failed stage and keep writers stopped while reporting. After cutover, critical schema/integrity/authentication/business failure means stop the new writer, preserve the failed migrated DB and related sidecars/logs, verify the frozen backup and rollback archive, and state the recovery point and any possible data loss.

**This approval request does not include automatic live restoration.** Obtain explicit approval for a specific restore/replacement and historical-release activation if recovery is needed. Restore only a coherent frozen baseline DB plus commit `21b4dd72…` and its matching frontend/configuration, never repaired code plus baseline DB. Do not use the token-hashing downgrade.

The historical backend lacks current MFA/session/security-version and hashed guest/share-link protections. Any approved rollback is time-bounded restricted recovery; signing-key/session compatibility must be reviewed and keys rotated through protected configuration before exposing the old verifier. Do not silently change real keys during preparation or routine cutover. Backups remain private, access-controlled and subject to approved retention; no historical backup is deleted or overwritten.

## 3. Separate checklist of live-changing actions requiring approval

- [ ] Freeze operator activity; gracefully stop the verified backend/reloader tree.
- [ ] Keep restart/reloader suppressed for the maintenance window.
- [ ] After backup/stage/ACL gates, replace the original DB with the verified new stage using `File.Replace`.
- [ ] Activate the verified repaired release under Parsh against the exact original path, with initialization/reload disabled.
- [ ] Permit the existing-account normal sign-in and resulting legitimate technical session/audit writes for acceptance.
- [ ] Stop the new writer on a critical failure; preserve evidence and request separate recovery authorization.

Not included: abrupt process termination, unrelated process/service/task changes, remote deployment, broad live ACL hardening, application/data reset, demo data, password/key changes, historical downgrade, automatic live restore, or an unreviewed release/revision/engine/path change.

## 4. Prepared-state report and approval boundary

| Required report item | Current result |
| --- | --- |
| Environment/release/writers | Refreshed local Windows identities, accounts, ports, manifests and exact archives verified |
| Before/after database evidence | Read-only Phase A state recorded; end-of-preparation safety recheck recorded separately; original not migrated |
| Business signatures/counts | Complete baseline signatures recorded; three existing business rows across user/workspace/membership |
| New maintenance backup | **NOT CREATED** — reserved for the authorized frozen window; historical backup remains verified |
| Migration commands/logs | Exact planned command above; **no T007 execution/stamp/upgrade log exists because Phase C is not executed** |
| Live deployment/startup | **NOT EXECUTED** — only isolated pairings refreshed |
| Existing-account API verification | **NOT EXECUTED** — requires operator sign-in after approved cutover |
| Recovery readiness | Verified historical archive and fresh isolated compatibility smokes; live restore requires a new explicit authorization |
| Original data preservation | No original business row modified/deleted/lost during preparation; protected hashes/timestamps/schema unchanged |

The specific remaining gate is **explicit approval of this exact local execution plan and operator availability**. The execution window and live-changing checklist have not started. Refresh preconditions again after approval; if they differ, stop and request review instead of applying stale assumptions.

Only after actual successful Phase C acceptance should the final report become `COMPLETED – LIVE MIGRATION VERIFIED` and recommend **T008 — Complete Authentication, Registration, Role-Based Access and Logout Verification**. The present next action is plan approval, not T008 or live execution.
