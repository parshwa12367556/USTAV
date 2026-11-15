# UTSAV T006 — Deployment writers and rollback release verification

Final status: **READY FOR SEPARATELY AUTHORIZED LIVE MIGRATION**.

This decision applies to the **observed local Windows installation** and the reviewed staged migration to `e5c0a3b7f912`. It does not certify an unobserved production/cloud deployment or authorize any live action. The actual writers are identified, repaired/rollback source archives are manifest-verified, both release/database pairings pass isolated smoke tests, and the repaired archive passes **97 backend tests**. The original database and existing backup remain unchanged.

No writer/service shutdown or startup command, live Alembic command, database replacement or live restore was executed during T006. The existing development server remained running; its own child replacement was observed. All verification applications used private disposable databases and Flask test clients, without starting a network listener.

## 1. Verified environment

Inspected on 14 November 2026. Repository: `D:\UTSAV`. Original database: `D:\UTSAV\backend\instance\utsav.db`. Python executable observed for the backend: `C:\Users\Parsh\AppData\Local\Programs\Python\Python314\python.exe`.

The environment is an interactive local Flask development server plus Vite development server. No matching production WSGI service/runtime was observed. Documentation mentioning Gunicorn/static hosting is a proposed deployment shape, not an installed service. The final query enumerated **320 processes, 292 services and 217 scheduled tasks**, plus current/common startup entries and Run/RunOnce registry entries. No UTSAV service/task/startup match or configured background-worker runtime was identified. One startup-folder item was examined with no repository match.

The default `run.py` loads private `.env` configuration, creates the app and enables the development server according to its debug setting. The factory can create an empty database or attempt stamping when certain initialization conditions hold; therefore it must not serve as an unstamped-baseline migration host. The reviewed copy-only maintenance host and explicit launch binding remain mandatory.

## 2. Writer and serving-process inventory

Final snapshot: **17:40:57 IST** (12:10:57 UTC).

| Identity | Parent | Verified role/evidence | SQLite ownership |
| --- | --- | --- | --- |
| Python **4492** | PowerShell **4720** | `run.py`, backend listener `127.0.0.1:5000`; parent of backend child | Restart Manager reports it using the exact original DB |
| Python **12996** | Python **4492** | Current `run.py` child | Restart Manager reports it using the exact original DB |
| Python **20988**, earlier snapshot only | Python **4492** | Earlier child replaced during inspection | Held the original DB earlier; no longer in final snapshot |
| Node **13840** | PowerShell **23000** | Frontend launcher ancestor | Not reported as a DB owner |
| cmd **24736** | Node **13840** | Frontend launch chain | Not reported as a DB owner |
| Node/Vite **14692** | cmd **24736** | Repository Vite invocation, listener `[::1]:5173` | Not reported as a DB owner |
| esbuild **28656** | Node/Vite **14692** | Executable under this repository's frontend dependencies | Not reported as a DB owner |

The Python parent/child pattern, source startup behavior and observed child replacement are consistent with the active development reloader. Both file owners must stop; stopping only a child is insufficient. Restart Manager's `Restartable=false` is not evidence that a development reloader cannot create another child.

File ownership was obtained through Windows Restart Manager registration/list APIs, **without shutdown/restart APIs**. CIM process identities alone were not treated as proof of SQLite ownership. Raw command lines, task arguments and registry values were classified internally and not emitted. Evidence: `writer-inventory.json`, `writer-inventory-final.json`, and timestamp-normalized `writer-inventory-final-iso.json`.

This is a point-in-time local inventory. It cannot prove the absence of future/transient writers, other user-profile startup mechanisms or another host. Arbitrary manually launched Flask CLI, SQLite tools or maintenance scripts can become writers later. A fresh inventory, no-owner check, disabled reloader tree and exclusive-open check are required in the actual maintenance window. No broad process-kill/service-disable action is appropriate.

## 3. Verified stop/start plan

The [PowerShell maintenance runbook](deployment/t006-windows-maintenance.md) contains exact read-only inventory commands, a PID/start-time/executable/parent-guarded stop fallback, no-owner/listener/exclusive-open checks, journal/WAL checks, explicit repaired-release launch binding, frontend restart and health-monitoring commands.

Prefer Ctrl+C in the original backend terminal 4720; stop/verify the complete parent/child tree. If graceful stop fails under future authorization, the guarded fallback targets only the freshly verified Python file owners, parent first. Do not stop the parent PowerShell terminal, VS Code or unrelated Python applications. No matching Windows service or scheduled task exists to stop/disable/restart, so none was invented in the runbook.

The prepared validation launch uses the observed application/server class and port with explicit database/release configuration, automatic initialization disabled where supported, and debug/reload disabled during maintenance. It is not represented as a production WSGI deployment. Actual stop/start and live exclusive-open success were **not tested**, because the task expressly prohibited lifecycle commands; identity, source and PowerShell syntax checks are verified. Six runbook PowerShell blocks and the inventory script parse successfully without executing their mutating statements.

## 4. Repaired release archive

Private evidence/release root:

`D:\UTSAV\backend\instance\utsav_t005_9k3sem3q`

The prefix was generated by the reused private-directory helper; `t006-marker.txt` identifies this directory as T006 evidence.

**Use this verified repaired archive:**

`utsav-repaired-t005-verified.zip`

SHA-256: `4d0863d42f408c80e55d5e2c0541b9566d0b4d2cf7d3168809d09fe0f6175d38`.

It contains **511 manifested files**, plus `RELEASE_MANIFEST.json`: Flask source, React source/static source assets, migrations including T003/T004 revisions, T003–T005 tests/verification scripts, frontend configuration and lockfiles, backend requirements and a pinned 44-distribution test/runtime snapshot, documentation, safe `.env.example` templates, Git-base provenance, changed/untracked source inventory and `WORKING_TREE.patch` for selected tracked source changes. It includes uncommitted repairs, not only Git base `87d63d3d346fc84d633c35f72645f41595bfda36`.

Every T005 application/migration/test source hash was checked against the final T005 rehearsal manifest before archiving. Final ZIP entries were extracted and individually verified against their manifest. Application/test/migration bytes in the full-suite test extraction and final verified archive match the T005-reviewed source. T006 preparation utilities are excluded from the final repaired deployment payload and remain in the workspace separately.

The archive excludes `.git` objects, private databases, instance directories, uploads, real `.env` files, runtime logs, node_modules, credentials and copied records. Strict path filtering, per-entry hashes and a scan against known local secret values passed. Test-only constants/fixtures and placeholder templates are source code, not deployed secret configuration. `archive-safety.json` records the checks. The repository owner has explicit read access to the private artifacts; only the sandbox account, owner, SYSTEM and Administrators otherwise hold relevant access. Existing database/backup ACLs were not changed.

An earlier archive candidate `utsav-repaired-t005.zip` is **rejected**, because generated lockfile CRLF bytes differed from its LF manifest hash. The corrected `-verified.zip` has the proper bytes and was fully verified; no earlier artifact was overwritten. See `verified-archives.json`. Do not deploy the rejected candidate.

## 5. Baseline rollback release identification

Selected historical commit:

**`21b4dd72f1808992696ec4307d47ed21b5abc40d`**.

This is a historical Git checkpoint selected from actual history, exported and newly packaged as a rollback candidate; no claim is made that it was a previously published/deployed release. No checkout, reset or modification of user source was needed. Historical source is unmodified; external isolated configuration supplies the disposable DB and test settings.

Archived as:

`utsav-baseline-rollback-21b4dd72.zip`

SHA-256: `06304430645053e796b972a5218444c0a8a47ed6282b83ccac20458238b167c1`.

The historical matching frontend/backend, migrations, safe templates, dependency/configuration manifests and individual file hashes are archived together. All ZIP manifest entries passed verification and the private-content/known-secret exclusion scan.

Candidate investigation deduplicated **22 historical source/model states** from Git history. Five plausible pre-security-column candidates were exported and tested in isolation:

| Candidate | Mappers | Schema comparison to baseline | Result |
| --- | --- | --- | --- |
| `21b4dd72…` | 41 | zero differences including defaults | Selected; pairing smokes pass |
| `8b89d254…` | 41 | zero differences including defaults | Also passes tested smokes |
| `f2685af5…` | 41 | zero differences including defaults | Also passes tested smokes |
| `e326cf23…` | 42 | expects revoked-token table/indexes | Rejected as baseline-incompatible |
| `f6294006…` | 44 | expects revoked-token/planner tables/indexes and vendor address | Rejected as baseline-incompatible |

The newer Git base and other security-era states were not assumed compatible because of their dates: model evidence shows security/token/FileAsset changes and, in several states, the known quotation mapper defect. Full source-state inventory is in `historical-candidates.json`; candidate comparisons/results are under `candidates/`.

## 6. Isolation and rollback compatibility tests

Created a dedicated venv with physically separate dependency files, **no system-site-packages**, and isolated Python `-I` subprocesses. Only the explicitly selected exported backend path is added to imports. Probe results record `sys.path`/prefix; the original backend and host site-packages were not on that path. Child environments inherit only necessary Windows execution/temp/path settings, not application secrets/PYTHONPATH/database configuration. Private `.env` files were not copied or loaded in tests. This isolates source, configuration, dependencies and databases, while sharing the operating system/base Python standard library; it is not a separate VM.

The dependency closure was pinned to 44 distributions and `pip check` reports no broken requirements. Redis, declared but missing from the original installed environment, was downloaded after sandbox-network denial and installed **only** in the isolated venv as `redis==6.4.0`; the global interpreter was not modified. Its wheel is preserved under `dependency-wheels/`. No Redis service/backend connection was configured or claimed tested; smoke/regression rate limiting used the isolated memory profile.

For each selected pairing, restored a fresh SQLite-consistent disposable copy of the T005 baseline or migrated restore stage. Controlled synthetic account, workspace/membership, event, vendor, quotation/item, booking, payment and transaction records were added **only to these private copies**. No actual account password was used or reported. Generated passwords and bearer tokens stayed in subprocess memory and were not included in result files.

The selected rollback application demonstrated:

- **41 mappers configured**; unrestricted metadata comparison, including server defaults, has **zero differences** against baseline `91d2e7a4c631`.
- Application startup and `/health`, `/api/v1/health`: 200.
- Synthetic verified-user login: 200; incorrect password: 401.
- Authenticated `/auth/me`, `/workspace/members`, `/events`, `/quotations`, `/bookings`, `/payments`: 200, with seeded business records returned where applicable.
- Exact schema snapshot unchanged immediately after startup **and after all smokes**; integrity `ok`; FK violations zero.
- The restored baseline's Alembic version table remained **empty**, matching the original backup state. The logical schema is revision `91d2e7a4c631`; no forced stamp was applied to make compatibility appear successful.

Rollback result/log: `rollback-pairing.json` / `rollback-pairing.log`. No application source was patched to obtain this result.

## 7. Repaired pairing and archived-source regressions

The final repaired ZIP was extracted to `repaired-verified-unpacked/` and paired with a new copy of the migrated T005 database at `e5c0a3b7f912`:

| Check | Repaired + migrated DB | Rollback + baseline DB |
| --- | --- | --- |
| Mapper count | 47 | 41 |
| Model/schema differences including defaults | 0 | 0 |
| Health / DB health | 200 / 200 | 200 / 200 |
| Valid login / wrong password | 200 / 401 | 200 / 401 |
| Auth/workspace/business read smokes | pass | pass |
| Schema unchanged at startup/after smokes | yes / yes | yes / yes |
| Integrity / FK violations | `ok` / 0 | `ok` / 0 |
| Version rows after smokes | `e5c0a3b7f912` | empty, preserved |

The repaired application was never pointed at the original baseline database. Results: `repaired-pairing.json`, `repaired-pairing.log`.

Additionally, the archived repaired application's complete backend suite ran under the isolated interpreter: **97 passed, zero failures/errors/skips, in 41.54 seconds**. Eight warnings concern the pre-existing deprecated migration `get_engine()` accessor. Full invocation/console output is captured in `archived-release-pytest.log`; arguments/exit code are in `archived-release-pytest-result.json`, and JUnit evidence in `archived-release-pytest.xml`.

The invocation used `isolated-python\Scripts\python.exe -I`, explicitly inserted only the exported backend path, then ran pytest with `-q --tb=long -p no:cacheprovider`, a private `--basetemp`, and JUnit output. The original fixture source was unchanged; test migrations used private databases built from the reviewed graph. The later archive correction changed packaging/lockfile newline representation and excluded T006 tooling, not application/test/migration bytes. No T006 frontend network server/build was launched; T005's frontend build passed, while T006's matching historical frontend is archived but not browser-certified.

## 8. Recovery limitations and security conditions

Compatibility is demonstrated for the tested schema/functions, not identical capabilities. The historical release lacks the current session/MFA/security-version system, newer token-hashing/revocation protections, FileAsset and later planner/security schema. Its registration/session/frontend contracts differ from current code, so restore its matching frontend/configuration as a pair. Do not mix current frontend/auth assumptions with the rollback backend.

A baseline restore is a **security downgrade** and can lose data written since the backup. Use it only as a time-bounded, restricted incident recovery mode. Rotate JWT signing material through protected configuration before public use: the old verifier does not enforce current session/security-version revocations. Restrict public guest endpoints/general access pending security review. This task did not change real keys or certify all historical endpoints as secure.

The token migration downgrade remains prohibited as a recovery method: it cannot reconstruct original bearer tokens. Restore a coherent verified baseline backup with the proven historical release instead. Backups may contain plaintext links; use private ACLs, appropriate encryption, custody/expiry and secure retirement policies. Never restore stale WAL/SHM/journal files onto an unrelated promoted database.

The current original-backed development listener was inventoried, not used for pairing/smoke verification. Health success on a separate pair does not assert that this already-running original-backed process is compatible with the current working tree. The observed reload reinforces the requirement to stop the full tree and freeze source during maintenance.

## 9. Original database unchanged

T006 before/after evidence confirms equality of source and existing backup hashes, sizes, modification times, complete table lists, version rows, journal/sidecar observations, integrity and FK checks. Both files were inspected using SQLite read-only connections; no migration/replacement/restore target was either protected file.

| Protected file | Size | SHA-256 | Modified Unix ns |
| --- | --- | --- | --- |
| `backend/instance/utsav.db` | 700,416 | `e57707a86311b42d0a8c0c76ccd02c1ba58bfa79b89a613b4c6bb86835068864` | `1794535861310146700` |
| `backend/instance/backups/utsav_pre_t002_20261113_083719.db` | 700,416 | `21fab206b7e5677e5106fd6e789fea03f9f13f779ae7ea9a6cc40f20a37464a7` | `1794539239745416600` |

Both still have 41 application tables plus `alembic_version`, zero version rows, integrity `ok`, zero FK violations, DELETE journal mode and no observed sidecars. Evidence: `t006-safety-before.json`, `t006-safety-after.json`. No existing backups were overwritten, deleted or repurposed. User working-tree changes were preserved.

## 10. Final readiness and handoff

The two T005 operational blockers are addressed for the observed local installation: writers and their reload behavior are identified with a guarded non-executing stop/start plan, and both repaired/migrated and historical/baseline release pairs are archived and compatibility-tested.

Before any separately authorized live action, refresh the inventory and source/release hashes, stop/drain the verified whole backend tree, prove no owners/writers/restarts remain, take and verify a **new** consistent backup, compare the complete baseline, migrate only a fresh frozen stage to exact `e5c0a3b7f912`, validate an independent restore stage, check same-volume replacement paths/ACLs, and authorize the cutover explicitly. Follow the runbook's post-start checks, paired rollback/key-rotation/restricted-access decision and backup retention controls. Do not deploy T006's smoke databases or reuse old rehearsal snapshots.

No unconditional claim about live concurrency, another host, production services, service-account permissions, external SMTP/payment services or every historical security feature is made. The stop/start commands remain deliberately unexecuted and must be revalidated in the authorized window. **Live migration remains unexecuted and requires a new explicit authorization task.**
