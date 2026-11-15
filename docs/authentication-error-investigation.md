# Authentication and registration error investigation

**Final status: CODE FIXED – LIVE MIGRATION STILL REQUIRED**

The current authentication code is incompatible with the original database. The reproduced schema failure is **BLOCKED BY UNAUTHORIZED T007 LIVE MIGRATION**. Application fixes are implemented and verified in isolation; they have not been applied to the active source tree. No live registration or refresh diagnostic request was sent. Live login/registration success is not claimed.

## 1. Exact backend exceptions

The only saved application log found, `backend/server.log`, contains two startup lines and was last modified on 2026-11-13. It has no retained request traceback for these incidents. Therefore the following are **isolated reproductions**, not recovered historical logs.

The reproduction cloned only the original database's schema, inserted one synthetic user in a disposable database, and called the real Flask routes/JWT guards. It did not copy or print private user records. A valid synthetic refresh JWT exercised the mandatory revocation guard; the guard was not bypassed.

| Request | Exact reproduced exception | Relevant application stack |
|---|---|---|
| `POST /api/v1/auth/refresh` | `sqlalchemy.exc.OperationalError`, wrapping `sqlite3.OperationalError: no such column: users.password_reset_attempts` | `backend/app/__init__.py:161`, `reject_inactive_or_stale_role`, `db.session.get(User, jwt_payload.get("sub"))` |
| `POST /api/v1/auth/register/family` | `sqlalchemy.exc.OperationalError`, wrapping `sqlite3.OperationalError: table users has no column named password_reset_attempts` | `backend/app/api/auth_routes.py:130` → `backend/app/services/auth_service.py:224`, first `db.session.flush()` |

These line numbers refer to the source used for the initial reproduction, before this investigation's added imports changed service line offsets. The relevant auth route and JWT guard were unchanged from the active source.

The refresh failure occurs **before the refresh route body**, while loading the full mapped User for JWT revocation/account checks. Its statement is a parameterized full-column User SELECT:

```sql
SELECT users.name, ..., users.password_reset_attempts, ..., users.id
FROM users WHERE users.id = ?;
```

Registration's duplicate preflight selects only `User.id`, so it can succeed even on this baseline. The subsequent User INSERT includes the new mapped authentication columns and fails:

```sql
INSERT INTO users
  (name, email, ..., password_reset_attempts, ..., security_version, ...)
VALUES (?, ?, ...);
```

[Complete safe SQL and traceback frames](../.tox/auth_investigation_20261114/evidence/final/baseline-reproduction.json) include exception classes and DBAPI messages, with no bound parameters, bearer tokens or private records. The synthetic failed registration left no partial account or workspace. Historical evidence is insufficient to assert that every previously observed 500 had this exact traceback, but both reported endpoint failures are reproducible from the confirmed live schema mismatch.

## 2. Meaning of 401, 400 and 409

All three were independently reproduced without an unexpected exception:

- **401 `/auth/me`:** expected when no usable JWT/session is available. The no-token reproduction returns the JWT library's missing-cookie/header response. Expired/revoked tokens and disabled accounts also fail authentication. A valid token against the incompatible baseline can instead encounter the schema exception above.
- **400 registration:** independent input validation rejects invalid email, missing/empty fields, short/weak passwords or unsupported input. Field guidance is now displayed safely in the frontend. This response does not itself imply a server/database fault.
- **409 registration:** the normalized email already belongs to an account. The baseline can return 409 because its narrow duplicate lookup does not require the missing columns. A duplicate response does not prove that account verification or login works. Use the established verification/login/recovery workflow; do not delete/reset the account as a diagnostic workaround.

The baseline reproduction produced, in order: **401, refresh 500, registration 500, duplicate 409, validation 400**. These responses are compatible with one unchanged database; they do not require inconsistent frontend behavior to explain them.

## 3. Schema compatibility findings

The original database was opened with SQLite `mode=ro`. No schema or data writes were performed there. Its Alembic version table remains empty.

The User table is missing eight mapped authentication columns:

```text
password_reset_attempts, password_reset_last_sent_at,
otp_attempts, otp_last_sent_at, security_version,
totp_secret_encrypted, totp_enabled, recovery_codes_hashes
```

Three required authentication/security tables are absent: `user_sessions`, `security_events`, and `revoked_tokens`. The current code requires persistent session/refresh-JTI/hash validation, account security versions, revoked-token checks, MFA state and security-event recording. Adding only the first missing User column would merely expose subsequent incompatibilities. Disabling these checks or silently creating fallback tables would weaken security and violate T007 restrictions.

Family workspace, membership and permission tables are present. Their ownership/member FKs, unique workspace-owner constraint, unique `(workspace_id, user_id)` membership constraint and unique `(membership_id, permission)` grants are present. The User email index is unique. These are not the immediate cause of either reproduced 500.

[Auth columns, indexes and FKs](../.tox/auth_investigation_20261114/evidence/final/auth-schema-details.json) and [all missing mapped tables/columns](../.tox/auth_investigation_20261114/evidence/final/schema-drift.json) are retained. Other pending differences include planner tables, FileAsset, RSVP/invitation-token fields, quotation revisions, refunds and transaction provider-event IDs. They belong to the pending reviewed migration chain, not an ad hoc authentication patch. No migration file was changed or added here.

## 4. Connection resets and reloader findings

**The exact cause of the user's historical `ERR_CONNECTION_RESET` remains unproven.** No timestamped server traceback/reload log or browser network capture survives to correlate a particular reset. An ordinary handled HTTP 500 is not a TCP reset: the isolated schema failures returned complete JSON HTTP 500 responses.

Read-only process observations establish a development reloader: parent PID 12488 persisted, with `WERKZEUG_RUN_MAIN=true` child processes. Child replacements were observed across snapshots (31528, 34368, later 35824). This supports reloader/process-lifecycle activity, but does not identify the trigger or correlate a specific historical request. No existing process was explicitly stopped or restarted by an investigation command.

**Correction to T008 and the initial investigation staging approach:** the earlier assumption that placing nested files under `.tox` prevents Windows watchdog reloads was incorrect. With the installed watchdog matcher and Werkzeug's exclusion `*/.tox/*`:

```text
D:\UTSAV\.tox\example.py                         excluded
D:\UTSAV\.tox\stage\backend\app\example.py      still matches
```

[In-memory matcher proof](../.tox/auth_investigation_20261114/evidence/final/watchdog-pattern-proof.json). Thus earlier staged Python/ZIP writes could trigger reloads despite not changing active application source. Automatic reload prevention cannot be claimed for that period; the earlier report has been corrected. This was an avoidable safety error in the staging assumption.

Remaining source work, tests and builds were moved to `C:\Users\Parsh\AppData\Local\Temp\utsav-auth-investigation-wfwpgi_c`, outside the repository. Final deliverables inside the repository use `.patch`, `.json`, `.log`, Markdown and `.tar.gz`, avoiding new Python/ZIP writes there. No reloader configuration was changed. The process observations remain insufficient to attribute every replacement to our writes or to diagnose unrelated external edits/process activity.

Original database integrity remains good. Frontend cancellation is now distinguished from transport errors, but there is no evidence that it caused the historical browser resets. If resets persist after an authorized deployment, retain the server terminal's timestamped reload/termination messages and matching browser request timing; do not infer their cause from HTTP 500 alone.

## 5. Application fixes and changed files

Ten files differ from the verified T008 implementation:

| File | Exact change |
|---|---|
| `backend/app/services/auth_service.py` | After rollback, map only the specific SQLite `UNIQUE constraint failed: users.email` collision to the existing 409 response; preserve other integrity failures as errors. This handles a concurrent-registration collision that the preflight lookup cannot prevent. |
| `backend/app/middleware.py` | Explicitly roll back unexpected request failures. Log exception class, stack locations and parameterized SQL without serializing SQLAlchemy bound values or arbitrary private exception messages. Keep generic public 500 JSON. |
| `backend/tests/test_auth_failure_investigation.py` | Eight new cases: successful owner/workspace creation without demo data; rollback at workspace/delivery/security/commit phases; precise duplicate-vs-other-integrity classification; general request rollback. |
| `frontend/src/context/AuthContext.tsx` | Share one restoration promise across React StrictMode effect replay; retain T008 stale-generation protection; distinguish HTTP status from network failure in sanitized diagnostics; ignore cancellation. |
| `frontend/src/features/auth/authErrorMessage.ts` | Central safe mapping for 400 validation, 401/403, 409 conflict, 429 throttling, 5xx, cancellation and network failure. |
| `frontend/src/pages/catalog/CatalogPages.tsx` | Use that mapping in the actual auth pages. Remove raw server `detail`/5xx exception display and the false network-failure assertion that an account was not changed. A lost response cannot prove the server failed to commit. |
| `frontend/index.html` | Declare the existing `/logo.svg` as the favicon. This avoids relying on an absent implicit favicon; it does not repair authentication or change live assets yet. |
| `frontend/src/tests/auth-errors.test.ts` | Validation/conflict/server-error/network/cancellation/throttling safety tests. |
| `frontend/src/tests/auth.test.tsx` | StrictMode single-restoration and fail-closed HTTP/network tests; existing invalid-credential mock now includes the real HTTP 401 status. |
| `frontend/src/tests/http-session.test.ts` | Assert one refresh attempt, cleared stale token and one session-expired event for refresh 401, 500 and network failure. |

Existing registration already had a rollback-protected transaction around user/workspace/member creation, delivery, security recording and commit. It was verified rather than unnecessarily rewritten. The new uniqueness handling is narrow: the tests inject a representative email-constraint collision, not an actual multi-process concurrency workload, and verify that an unrelated FK failure remains HTTP 500.

The active source files were not patched, because that could restart the prohibited live server. The combined patch includes the previously staged T008 repairs; the delta is for a tree already containing T008.

## 6. Registration and login verification

**Registration works in isolation** on disposable SQLite migrated through `e5c0a3b7f912`: input/password validation, normalized duplicate detection, password hashing, unverified account creation, real OTP verification, family workspace and owner membership, and correct response/status flow. Failed transactions leave no partial user/workspace/membership/security-event records and a retry succeeds. No demo events, guests, vendors or payments are inserted.

The browser test submits the real form, receives the synthetic account's OTP through a private test email inbox, submits it to the real verification endpoint, and reaches its correctly named empty dashboard. Only email transport is substituted; OTP/MFA checks are not bypassed.

**Login works in isolation.** Real browser accounts authenticate with the real backend. The full backend suite covers incorrect password 401, unverified-account denial, refresh rotation/revocation/CSRF, expired tokens, disabled accounts, logout, session revocation, administrator TOTP/recovery, role authorization, planner/vendor boundaries and family workspace isolation. The T005 invitation revocation and owner-only explicit reissue regressions remain green.

## 7. Verification results and exact commands

All final runs used the external temporary source tree, not the original database. The backend fixture migrates a disposable template to `e5c0a3b7f912`, copies it per test, asserts the resolved target and FK enforcement, and checks integrity/FKs at teardown.

From the external tree's `backend` directory:

```powershell
& 'D:/UTSAV/backend/instance/utsav_t005_9k3sem3q/isolated-python/Scripts/python.exe' -m pytest tests -q --basetemp='C:/Users/Parsh/AppData/Local/Temp/utsav-auth-investigation-wfwpgi_c/pytest-external'
```

From its `frontend` directory:

```powershell
npm.cmd test -- --reporter=dot
npm.cmd run build
$env:T008_PYTHON='D:/UTSAV/backend/instance/utsav_t005_9k3sem3q/isolated-python/Scripts/python.exe'
npm.cmd run test:browser
```

| Check | Final result | Evidence |
|---|---|---|
| Complete backend suite | **117 passed**, 8 existing migration-host deprecation warnings, 62.54 seconds, exit 0 | [Backend output](../.tox/auth_investigation_20261114/evidence/final/backend-external.log) |
| Frontend tests | **33 passed**, 3 files, 4.43 seconds, exit 0 | [Test output](../.tox/auth_investigation_20261114/evidence/final/frontend-external-tests.log) |
| TypeScript + production Vite build | **Passed**, Vite 4.40 seconds, exit 0 | [Build output](../.tox/auth_investigation_20261114/evidence/final/frontend-external-build.log) |
| Real Chrome browser tests | **5 passed**, 21.9 seconds, exit 0 | [Browser output](../.tox/auth_investigation_20261114/evidence/final/browser-final.log), [JSON results](../.tox/auth_investigation_20261114/evidence/final/browser-results.json) |
| Combined and T008-delta applicability | Both `git apply --check` passed; neither applied | Patches linked below |

The browser cases cover real login/server logout/revoked-token rejection/back navigation/account isolation, registration with OTP, and authenticated dashboards at 360/768/1440 px with no horizontal overflow. The runner creates fresh databases and cleans up only its own test servers on ports 5001/5174. It does not stop original ports 5000/5173.

Initial external frontend attempts failed for test-environment reasons: copying while excluding every `dist` folder omitted dependency distributions; after restoring dependencies, esbuild's ancestor-directory lookup hit sandbox permissions. The final runs restored complete dependencies and ran with the requesting user's access to the newly created temporary directory. No security assertion was skipped or weakened, and no application fallback was introduced to conceal either failure.

## 8. Favicon and video messages

The favicon declaration is fixed in staged `frontend/index.html` using the existing SVG. This is independent of authentication.

No `<video>` element, video source, programmatic media playback call or matching AbortError handler was found in the inspected application source. Interrupted playback commonly has a separate browser/media lifecycle, but the supplied console message alone cannot identify its origin here. No invented media fix was made. A source URL and stack would be needed to attribute it to this application rather than another page/component/extension.

## 9. Original-data safety and remaining live blocker

[Safety before/after](../.tox/auth_investigation_20261114/evidence/final/safety-after.json) verifies unchanged bytes, size and nanosecond modification time:

| File | SHA-256 |
|---|---|
| `backend/instance/utsav.db` | `e57707a86311b42d0a8c0c76ccd02c1ba58bfa79b89a613b4c6bb86835068864` |
| Existing pre-T002 backup | `21fab206b7e5677e5106fd6e789fea03f9f13f779ae7ea9a6cc40f20a37464a7` |

Both remain 700416 bytes with original mtimes, integrity `ok` and no FK violations. All 433 monitored original application/config files still match their pre-T008 hashes. Documentation was updated, including the explicit correction to the earlier reloader-safety statement. No original database migration/stamp/alter/reset/replace, test account, password reset, data change or active database-path change occurred. No backup was overwritten.

**The original live installation remains blocked by T007.** Do not apply these patches under the active reloader or attempt live registration/refresh to work around the mismatch. An authorized maintenance/cutover process must reconcile the schema and deploy a newly pinned, rehearsed release. The old T006/T007 artifact hashes do not cover these changes. Production SMTP, domain/TLS cookie configuration and any further live-only errors still require authorized deployment verification.

## 10. Deliverables

- [Combined repaired implementation patch](../.tox/auth_investigation_20261114/evidence/final/auth-repaired-combined.patch): 36 changed/new files relative to the current active working tree, including T008. SHA-256 `c464ea33e34e05e86700a51a2a787d1829682fb9f822118ea563dfe173c62bca`.
- [Investigation-only delta](../.tox/auth_investigation_20261114/evidence/final/auth-investigation-delta.patch): 10 files relative to the verified T008 staging tree. SHA-256 `9d8d1479dda0453ad0ed29e0e3c5fcde4ad01a62ce972bd2f202df7c78a714a8`.
- [Changed-source archive](../.tox/auth_investigation_20261114/evidence/final/auth-repaired-source.tar.gz): code/tests/configuration only; no databases, credentials, private inbox or dependencies. SHA-256 `adacf5daaa5a662cf94db0db6cf44b0b3d774c0fb4e291f1864eacf738ceb64c`.
- [File hashes and inventory](../.tox/auth_investigation_20261114/evidence/final/changed-files.json), [verification summary](../.tox/auth_investigation_20261114/evidence/final/summary.json).

The schema diagnosis is conclusive for the reproduced 500s. Application repairs and migrated-schema authentication are verified in isolation. Historical connection-reset and video attribution remain limited by missing incident evidence; live functionality remains unverified and blocked.
