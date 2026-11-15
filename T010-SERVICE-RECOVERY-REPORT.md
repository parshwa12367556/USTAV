# T010-SERVICE-RECOVERY-REPORT

Date: 2026-11-15 (Asia/Calcutta). **T010 diagnosis and isolated verification completed. No live recovery, restart, migration or deployment was performed.**

**ROOT CAUSE NOT ESTABLISHED – INSUFFICIENT RUNTIME EVIDENCE.** This applies to the final disappearance of the previously running Flask and Vite processes. There is now confirmed evidence of an earlier Python crash and a later Windows power-off request; neither should be conflated with an authenticated request's schema error or treated as a complete process-exit history.

Recommended next safe action: review the evidence and use **Option B**, the separately hosted candidate with disposable data, for development. Any original-service restart needs separate authorization. T007 Phase C remains unauthorized.

## 1. Current Flask status

Port **5000 is not listening**. No pre-existing Flask entry-point/reloader process was found before or after this task. Repeated TCP probes timed out at approximately one second per attempt; there was no HTTP response/status to report. Because no listener existed, no original `/health` or `/api/v1/health` request was submitted. No original login, registration, refresh or reset request was submitted.

The problem currently includes **service absence**, independently of the database incompatibility. Starting a second process on an occupied port, if circumstances change, is not part of the recommendation.

## 2. Current Vite status

Port **5173 is not listening**, and no pre-existing Node/Vite process was found. Its current frontend response is unavailable. The existing `frontend/dist/index.html` and compiled JavaScript are present; their presence is not evidence of a running Vite server.

The isolated verification used **5001 and 5174** only. Both were checked available before the runner started its owned processes. Final inspection confirms all four ports have no listeners and no owned test servers remain.

## 3. Process, port, service and task inventory

[Initial inventory](.tox/t010-evidence-20261115/services-before.json) and [final inventory](.tox/t010-evidence-20261115/services-final.json) record process IDs, parent IDs, creation times, executables and safe command classifications. The only Python process in the initial snapshot was the inspection command itself; it was not a Flask server. Potentially credential-bearing arbitrary arguments were not dumped.

Read-only Windows service/task inspection found **no UTSAV registration** matching the project name/path. This is not a claim that the machine has no other services or scheduled tasks. No registration was changed or executed.

The Windows kernel boot-time observation was 2026-11-12 03:56:58 UTC. It is insufficient by itself to decide whether a later shutdown request completed, was canceled, or involved Windows fast-start behavior. No such inference is made.

Evidence: [registrations/events](.tox/t010-evidence-20261115/windows-registrations-events.json), [targeted event review](.tox/t010-evidence-20261115/targeted-event-review.json), [host probes/boot observation](.tox/t010-evidence-20261115/host-connectivity-boot.json).

## 4. Available runtime logs

The earlier investigation overlooked `backend/server.err`; the prior statement that only a two-line startup log was available was incomplete. This report corrects that evidence gap without rewriting the pinned T009 artifact.

| Existing file | Observed content | Limits |
|---|---|---|
| `backend/server.log` | 47 bytes, two startup/debug lines | No request or exit traceback |
| `backend/server.err` | 23043 bytes, 461 lines; November 13-era watchdog reloads, a mapper traceback and fatal interpreter shutdown | Not a continuous log of the later November 14–15 processes; no matching Vite exit log found |

Selected original lines:

```text
4:   Restarting with watchdog (windowsapi)
8:   Detected change in ...backend/app/services/match_quotes.py, reloading
454: sqlalchemy.exc.InvalidRequestError: Mapper 'Mapper[QuotationRequest(quotations)]' has no property 'items'.
455: [13/Nov/2026 10:00:01] POST /api/v1/auth/refresh ...
     Fatal Python error: _enter_buffered_busy: could not acquire lock for
     <_io.BufferedWriter name='<stderr>'> at interpreter shutdown,
     possibly due to daemon threads
456: Python runtime state: finalizing
```

Additional reloads reference diagnostic scripts, model edits and installed Python modules. These are observed reload events, not assumptions that every HTTP 500 terminates a server. Log hashes, mtimes, line numbers and safe excerpts are in [runtime-log-findings.json](.tox/t010-evidence-20261115/runtime-log-findings.json). Raw credential-bearing request dumps were not copied into the report.

## 5. Confirmed causes versus hypotheses

**Confirmed historical failure:** Windows Application Error record **72683** at **2026-11-13 10:00:03.555 IST** identifies `python.exe`, faulting module `ucrtbase.dll`, exception code `c0000409`, PID `0x4838`. Windows Error Reporting records 72684/72685 follow in the same window. This closely correlates with the stderr fatal shutdown at 10:00:01. It establishes an abnormal historical Python exit, not which thread/actor initiated interpreter shutdown or the final termination cause of later processes.

**Confirmed later event:** System/User32 record **65272** records an `Explorer.EXE` **power off request at 2026-11-14 20:39:34.996 IST**. That falls after the T009 initial running-service observation and before later absence. It is a credible explanation for interactive development services disappearing, but a request alone does not prove completed shutdown or the exit of each particular Flask/Vite process. Earlier power-off requests also exist.

**Not established:** a later Node crash, terminal closure, specific port conflict, exact final Flask/Vite exit status or direct correlation between each historical connection reset and a process event. The broad latest-300 Application-event review initially found no matches; targeted Application Error/Windows Error Reporting queries did recover the older crash records. No matching Node crash was found in the inspected records. Event inspection is not exhaustive forensic proof of absence.

**Separate confirmed request defect:** current mapped authentication columns/tables are missing from the original database. That explains the reproduced registration/refresh 500s, but is not proof of service termination. A handled JSON HTTP 500 is not a TCP reset.

The old missing `QuotationRequest.items` relationship is already corrected in current source. Current-source copies configure all **47 mappers** successfully. The historical traceback should not be presented as a newly reproduced current mapper failure.

Evidence: [selected crash/shutdown event fields](.tox/t010-evidence-20261115/event-details-safe.json). Root cause of the final dual-service disappearance remains **ROOT CAUSE NOT ESTABLISHED – INSUFFICIENT RUNTIME EVIDENCE.**

## 6. Backend runtime and dependencies

Available command-resolved Python: `C:\Users\Parsh\AppData\Local\Programs\Python\Python314\python.exe`, **Python 3.14.6**. `py --list-paths` reports no registered Python installations, despite the real interpreter being available; future commands therefore use an absolute interpreter path rather than relying on the launcher.

The previously verified isolated interpreter is:

```text
D:\UTSAV\backend\instance\utsav_t005_9k3sem3q\isolated-python\Scripts\python.exe
```

Its `pyvenv.cfg` has `include-system-site-packages = false`. All **43 T009 lockfile versions match** that environment. Both global and isolated `pip check` report no broken installed requirements. No package was installed or upgraded.

| Package | Global / verified isolated |
|---|---|
| Flask | 3.1.0 / 3.1.0 |
| Flask-SQLAlchemy | 3.1.1 / 3.1.1 |
| SQLAlchemy | 2.0.51 / 2.0.51 |
| Alembic | 1.19.1 / 1.19.1 |
| Flask-Migrate | 4.1.0 / 4.1.0 |
| Flask-JWT-Extended | 4.7.1 / 4.7.1 |
| Werkzeug | 3.1.8 / 3.1.8 |
| Redis client | **missing** / 6.4.0 |

The global environment does not fully satisfy project-declared requirements because `redis>=5,<7` is absent. `pip check` alone does not check an arbitrary project's requirements file. Current development configuration uses the default in-memory limiter, so this missing package was **not reproduced as a current startup blocker**. Redis-backed configuration would require a complete environment; no active-environment installation was attempted. Global watchdog 6.0.0 is present; the isolated test servers explicitly use no reloader.

`backend/run.py` loads `backend/.env`, creates the application, and ordinarily runs on 127.0.0.1:5000 with the configured debug flag. `wsgi.py` imports that app. Development config sets debug true; production/testing configs set it false. The original factory's auto-initialization branches are another reason not to launch blindly. The proposed availability-only command below explicitly disables startup schema initialization and reloading.

Safe configuration inspection found development mode, configured Flask/JWT secrets (values not exposed), SQLite URI `sqlite:///instance/utsav.db`, console OTP delivery and no configured SMTP credentials. Production SMTP/TOTP/shared-rate-limit readiness is not certified. No system PATH or JAVA_HOME was changed.

Evidence: [global versions](.tox/t010-evidence-20261115/global-python.json), [project dependency checks](.tox/t010-evidence-20261115/dependency-and-connectivity-review.json), [verified lock match](.tox/t010-evidence-20261115/verified-python-lock-review.json), [safe configuration review](.tox/t010-evidence-20261115/configuration-review.json).

## 7. Frontend runtime and configuration

Node **24.16.0**, npm **11.13.0**. Active installed versions include Vite **6.4.5**, React **19.3.1**, TypeScript **5.9.3**, React Vite plugin **4.7.0** and Axios **1.21.0**. All **16 active** top-level dependency versions match their npm lock entries; all **21 candidate** versions also match. This is not a fresh dependency install certification.

The active command is `npm run dev` → `vite`; build is `tsc -b && vite build`. Vite config contains the React plugin and no API proxy. The source fallback and existing compiled bundle both use **`http://localhost:5000/api/v1`**. No active VITE_API_BASE_URL override was found. Backend CORS allows both `http://localhost:5173` and `http://127.0.0.1:5173`.

Use a consistent hostname for frontend/API cookies. Visiting a 127.0.0.1 frontend while using a localhost API can produce cross-site cookie behavior despite valid CORS; that is a configuration risk, not an established cause of the observed 500s or process exits. The isolated test uses 127.0.0.1 for both services.

Evidence: [frontend lock review](.tox/t010-evidence-20261115/frontend-lock-review.json), [existing build review](.tox/t010-evidence-20261115/active-build-review.json). No active frontend source or build was changed.

## 8. Original SQLite integrity and revision

The original file and historical backup were opened/read only for metadata, hashes and integrity checks.

| File | Size | SHA-256 |
|---|---:|---|
| Original `backend/instance/utsav.db` | 700416 | `e57707a86311b42d0a8c0c76ccd02c1ba58bfa79b89a613b4c6bb86835068864` |
| Existing pre-T002 backup | 700416 | `21fab206b7e5677e5106fd6e789fea03f9f13f779ae7ea9a6cc40f20a37464a7` |

Before/after bytes, size and nanosecond modification times match. The original contains **42 tables including `alembic_version`**; the version table has **zero rows**. Integrity is `ok`, with zero FK violations. No version stamp, table addition or data mutation was performed.

The full table/column inventory is in [original-schema.json](.tox/t010-evidence-20261115/original-schema.json). Do not infer that an empty version table authorizes stamping head.

## 9. Authentication schema compatibility

Current User metadata requires eight columns absent from the original file:

```text
password_reset_attempts, password_reset_last_sent_at,
otp_attempts, otp_last_sent_at, security_version,
totp_secret_encrypted, totp_enabled, recovery_codes_hashes
```

`user_sessions`, `security_events` and `revoked_tokens` are also missing. Current code's User INSERT/lookup includes the missing fields. The prior isolated reproductions remain consistent with this verified mismatch:

- Registration: `sqlalchemy.exc.OperationalError`, `table users has no column named password_reset_attempts`.
- Refresh: `sqlalchemy.exc.OperationalError`, `no such column: users.password_reset_attempts`, during the mandatory JWT account/revocation lookup.

Restarting Flask does not add these columns. Disabling JWT/session/MFA checks or silently creating tables is not a recovery procedure. Console OTP mode also does not establish working SMTP delivery. Live authentication remains blocked by the pending reviewed schema/deployment work.

## 10. T009 candidate verification

All expected artifacts exist under `.tox/t009-evidence-20261114/final`, and all four checksums match `RELEASE-CHECKSUMS.json`:

| Artifact | SHA-256 |
|---|---|
| `UTSAV-T009-RC.tar.gz` | `d8813053cc489c7514977cc26ba2137c3346d10699d64204af1ae86502cb2e63` |
| `T009-combined.patch` | `bac0e3523d68e4b019de8fde2914ab4fca2cb8d5defbfd8a4b9134aa120de6c3` |
| `MANIFEST.json` | `1294fb516802cb2139fb5bfc138d8c84313b5c440a02277a6c8710bee2a33dc3` |
| `SHA256SUMS` | `32e67ad4d45d822f4c51e786e9be72eb5c8ee820fcff742afc90cec3ca382b1d` |

The archive was safely extracted **outside the watched repository**, to `C:\Users\Parsh\AppData\Local\Temp\utsav-t010-sg8bqktg\UTSAV-T009-RC`. All **494 manifested file hashes**, plus SHA256SUMS, were verified before testing and all manifested file hashes still match afterward. A separate T010 test helper was added only in that isolated extraction; the archive and active tree were not modified.

Candidate dependencies were physically copied from the previously verified isolated node_modules, excluding caches. No packages were installed. A first attempt to copy permission-restricted caches failed; retrying without those unnecessary caches succeeded. Only the newly created temporary workspace received permissions for the requesting user's test runner.

Evidence: [artifact verification](.tox/t010-evidence-20261115/artifact-verification.json).

## 11. Isolated startup and authentication results

**Candidate startup and all requested focused flows passed.** The candidate's existing test harness created a fresh SQLite database through Alembic `e5c0a3b7f912`, started only owned servers on **5001/5174**, and cleaned up only those processes. It did not use ports 5000/5173 or the original database.

| Check | Result |
|---|---|
| Flask actual HTTP `/health` | 200, observed 8ms |
| Flask actual HTTP `/api/v1/health` | 200, observed 7ms |
| Vite `/login` | 200; real React/API interaction |
| Family registration and email OTP | Passed through real endpoints; only outbound email transport captured in test inbox |
| Login, authenticated dashboard, account isolation | Passed in real browser |
| Refresh without CSRF header | Correctly denied, 403 |
| Valid refresh | 200, cookie rotated; identity preserved |
| Reload/session restoration | Correct dashboard identity restored |
| Logout | Login redirect; previous access token denied, 401 |

**3 browser tests passed in 14.6 seconds; exit 0.** T010 did not rerun the entire T009 130-test suite or claim those as new T010 tests. The selected tests specifically cover the requested startup/authentication diagnosis.

The disposable test DB is `...\UTSAV-T009-RC\e2e-75535edb\e2e.db`: **48 tables, revision e5c0a3b7f912, integrity ok, zero FK violations**. The server asserts the resolved target and FK enforcement before seeding test-only accounts; a read-only post-test inspection with FK enforcement enabled also passes. No real user records or credentials were copied. No auth/authorization/CSRF/OTP/MFA bypass was added. Production mail, HTTPS and real-provider integrations were not tested.

Additionally, unmodified current backend source was copied outside the repository and tested with **schema-only, no-user-data baseline copies opened `mode=ro`**. Both the global interpreter and verified interpreter configured 47 mappers and returned 200 from both health routes, without changing either disposable file. This demonstrates that factory/health availability can work while authentication is schema-incompatible; it is not a live launch or a claim of live auth success.

Executed focused command (from the isolated candidate `frontend` directory):

```powershell
$env:T008_PYTHON='D:/UTSAV/backend/instance/utsav_t005_9k3sem3q/isolated-python/Scripts/python.exe'
npm.cmd run test:browser -- tests/browser/auth.spec.cjs tests/browser/t010-runtime.spec.cjs --grep 'real login|registration requires|T010'
```

Evidence: [browser output](.tox/t010-evidence-20261115/browser-final.log), [browser JSON](.tox/t010-evidence-20261115/browser-results.json), [health/refresh results](.tox/t010-evidence-20261115/t010-runtime-health.json), [candidate DB checks](.tox/t010-evidence-20261115/candidate-database-final.json), [global baseline probe](.tox/t010-evidence-20261115/baseline-startup-global.json), [verified baseline probe](.tox/t010-evidence-20261115/baseline-startup-verified.json).

## 12. Safe recovery options

**Option A — availability only, without migration.** After separate restart authorization and a fresh port/config/hash check, existing source can be launched without reloader/startup schema initialization. The copy-based probes support health startup, but do not guarantee every aspect of the live environment. Existing frontend source can be served by Vite. Registration, authenticated User loading, refresh, persistent-session/security/MFA-dependent operations remain incompatible with the original database. Public/static/health availability is not full application recovery. Use a complete verified interpreter; do not install into the global environment implicitly.

**Option B — recommended for immediate development.** Use the extracted verified candidate outside watched paths, its isolated interpreter/dependencies and a new disposable migrated SQLite database. The already-tested harness runs on 5001/5174 and owns/cleans up its own processes. The interactive test fixture server can also be run on those isolated ports for development; its synthetic records are explicitly test data, not original user data. Do not replace the original DB, change the active connection or apply the patch.

**Option C — future migration/deployment.** Prerequisites only: separate T007 Phase C authorization, exact-artifact review, fresh writer inventory and maintenance plan, safe non-overwriting backup, correct baseline recognition, disposable compatibility rehearsal and matching rollback release, production configuration/provider review, and acceptance of T009 product limitations. No live migration/deployment command was executed or authorized by this task.

## 13. Exact proposed commands — NOT EXECUTED against original services

These are for a **future separately authorized operation**, not instructions that were run during T010. First verify port availability; if a port is occupied, stop and inspect rather than terminate its owner:

```powershell
Get-NetTCPConnection -State Listen -ErrorAction SilentlyContinue |
  Where-Object { $_.LocalPort -in 5000,5173 } |
  Select-Object LocalAddress,LocalPort,OwningProcess
```

Option A backend, in its own authorized terminal:

```powershell
Set-Location -LiteralPath 'D:\UTSAV\backend'
$env:PYTHONDONTWRITEBYTECODE='1'
& 'D:\UTSAV\backend\instance\utsav_t005_9k3sem3q\isolated-python\Scripts\python.exe' -c "from dotenv import load_dotenv; load_dotenv('.env'); from app import create_app; app=create_app(overrides={'AUTO_INIT_DATABASE':False}); app.run(host='127.0.0.1',port=5000,debug=False,use_reloader=False)"
```

This leaves the existing SQLite path from `.env` in place and disables automatic create/stamp and watchdog reload. It does **not** make runtime authentication writes or missing schema safe/functional, so initially restrict verification to the two health routes. Authorization must cover starting this runtime; it has not been granted here.

Option A frontend, in another authorized terminal, with a temporary process-only API override to keep cookie hostnames consistent:

```powershell
Set-Location -LiteralPath 'D:\UTSAV\frontend'
$env:VITE_API_BASE_URL='http://127.0.0.1:5000/api/v1'
npm.cmd run dev -- --host 127.0.0.1 --port 5173 --strictPort
# Open http://127.0.0.1:5173
```

Do not run `npm install`/`pip install`, modify `.env`, or apply patches as an implied part of availability recovery. Further changes require their own review.

Option B interactive **isolated** development, only using the verified external extraction and a new fixture DB:

```powershell
$candidate='C:\Users\Parsh\AppData\Local\Temp\utsav-t010-sg8bqktg\UTSAV-T009-RC'
$env:T008_E2E_PRIVATE=Join-Path $candidate ('review-data-'+[guid]::NewGuid().ToString('N'))
& 'D:\UTSAV\backend\instance\utsav_t005_9k3sem3q\isolated-python\Scripts\python.exe' -I (Join-Path $candidate 'backend\tests\t008_e2e_server.py')
# Separate terminal:
Set-Location -LiteralPath 'C:\Users\Parsh\AppData\Local\Temp\utsav-t010-sg8bqktg\UTSAV-T009-RC\frontend'
$env:VITE_API_BASE_URL='http://127.0.0.1:5001/api/v1'
npm.cmd run dev -- --host 127.0.0.1 --port 5174 --strictPort
```

Check 5001/5174 are free before that option. The backend fixture refuses an existing database and requires its target inside the isolated candidate. Test credentials are defined in the fixture, not real accounts. Stop only those newly owned isolated terminals when finished; no blanket process-kill command is proposed. For reproducible automated startup/cleanup, prefer the successfully executed browser command above. Temporary paths may need a fresh verified extraction if later cleaned by Windows.

## 14. Risks and unresolved blockers

- The final disappearance of the original services lacks definitive per-process exit evidence. The correlated November 13 crash and November 14 power-off request are recorded, with their limits.
- The original schema cannot support current authentication. A restart is not a schema migration and cannot be reported as fixing registration.
- Global Python lacks the declared Redis client; the registered `py` launcher inventory is inconsistent with the available interpreter. Prefer verified absolute paths; no repair/install was performed.
- Production SMTP/TOTP/shared rate-limit/HTTPS configuration is not ready merely because development health works. Console OTP transport is not verified email delivery.
- Watchdog observed extensive reloads historically, and nested `.tox` is not a reliable exclusion on this Windows setup. Keep recovery testing outside watched roots and explicitly disable reload for owned test servers.
- T009's undefined pricing/reservation/revision/private-attachment/refund/delivery contracts remain as documented; startup does not complete those features.

## 15. Final safety confirmation

**T007 Phase C was not executed.** No original database or backup bytes/size/mtime changed; **437 active source/config/test hashes remain unchanged**. T009's archive/checksums are unchanged and all 494 manifested candidate files remain unchanged after the isolated test. No active patches, packages, database configuration, PATH or JAVA_HOME changes occurred. Original services were not started, stopped or restarted. Only explicitly owned isolated test processes were cleaned up; final inventory finds none remaining.

See [safety and verification summary](.tox/t010-evidence-20261115/safety-and-verification-final.json). This report establishes a verified isolated recovery procedure and available historical evidence, **not a fabricated live recovery**. Review and choose the next authorized action separately.
