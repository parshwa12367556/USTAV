# T008 authentication and dashboard verification

**Status: T008 COMPLETED – VERIFIED IN ISOLATED ENVIRONMENT**

Verified on 2026-11-14. Live integration and deployment remain **BLOCKED pending T007**. This report does not authorize Phase C.

The implementation is in `D:\UTSAV\.tox\t008_264f2fa2`, with a reviewable, application-ready patch. It was not applied to the running application's source directories. **Correction from the subsequent authentication investigation:** the assumption that `.tox` excludes all nested files from Windows watchdog reloads was incorrect. Nested staged Python/ZIP writes can match the reloader, so this report does not establish that automatic reloads were prevented. No explicit existing-service stop/restart command was issued. Future work must run outside the repository's watched paths. Only processes created for disposable browser testing were explicitly cleaned up.

Delivery:

- [Implementation patch](../.tox/t008_264f2fa2/T008-implementation.patch), SHA-256 `430383a1a6604b67b0ee61b8623d2aba56e284485547818a8628095ec39c9e64`.
- [Changed source archive](../.tox/t008_264f2fa2/T008-changed-source.zip), SHA-256 `250326e5095fa35be30f759806089bc322ec17286837f8add84d9922dc530059`. Contains the 30 changed/new source and test files, not databases, credentials, uploads, browser profiles, or dependencies.
- [Exact file inventory and before/after hashes](../.tox/t008_264f2fa2/T008-files.json).
- `git apply --check .tox/t008_264f2fa2/T008-implementation.patch` passed against the current working tree. The patch was not applied there.

## 1. Authentication audit findings

The existing backend already implements email/password authentication, independent schema validation, Werkzeug password hashing, verification OTPs, persistent JWT sessions, rotating HttpOnly refresh cookies, CSRF checks, password recovery, session management, scoped memberships, administrator TOTP/recovery codes, rate limiting, and security-event recording. These were preserved and exercised, rather than replaced.

Email is the supported login identifier. Phone is an optional contact field; this work does not claim phone/password login or SMS delivery. Public role-specific registration supports family, vendor, and planner workflows. Public registration cannot grant administration or vendor-staff privileges. Membership invitations implement separately authorized, email-bound acceptance.

The active dashboard greeting already used the authenticated name. A hardcoded “Priya” greeting was not reproduced in that component. Confirmed problems were stale identity/data races, legacy demo workspace identity, fabricated business summaries, and broken dashboard alias calls. The browser tests use distinctly named synthetic accounts to establish actual identity isolation.

## 2. Root causes and repairs

| Confirmed defect | Repair |
|---|---|
| Older `/auth/me` restoration could overwrite a newer login/MFA flow | Authentication generation checks; explicit MFA transition; stale restoration ignored |
| Late responses or refresh could populate a different account/workspace | Request generation cancellation and refresh identity/membership consistency checks |
| Logout skipped the server call when the in-memory access token was absent | Always attempt server logout, including cookie-restored sessions; immediately clear private UI/cache; report revocation failure |
| Child-page state survived membership changes | Key the workspace outlet by identity/membership; scope catalog storage/effects |
| Persisted-state hook briefly returned the previous key's data | Read the new key immediately, including functional updates |
| Legacy workspace context/topbar used demo family identity | Derive workspace exclusively from verified authentication context |
| Family/vendor dashboard aliases omitted required membership arguments | Resolve and validate selected membership, then call scoped serializers correctly |
| Family spending was fabricated as 35% of budget | Sum actual paid expense records; independently scope guest, budget, booking, payment and invitation data |
| Static notifications, catalog seed records and mock event operations looked real | Use authenticated APIs or honest empty/unavailable states; label sample artwork |
| Whitespace-only identity/workspace names passed validation | Trim identity fields before validation; never trim passwords or verification codes |

## 3. Files modified

All paths below refer to the isolated implementation. The original source files remain unchanged.

| Files | Changes |
|---|---|
| `backend/app/api/dashboard_routes.py` | Scoped identity, corrected aliases, actual expense/booking/payment/invitation/package/quotation summaries, upcoming functions and per-user notifications |
| `backend/app/schemas/auth_schema.py` | Shared identity-field normalization before existing validation |
| `backend/tests/test_t008_dashboard_auth.py` | Twelve new cases including parameterized input/privilege checks |
| `backend/tests/t008_e2e_server.py` | Fresh migrated synthetic browser-test database, verified target/FKs, test-only email inbox |
| `frontend/src/context/AuthContext.tsx` | Race-safe session restoration/transitions, cookie-session logout and cache clearing |
| `frontend/src/services/{api/apiClient,storage/tokenStorage}.ts` | Request generations, stale-response rejection, refresh scope validation |
| `frontend/src/features/auth/api/authApi.ts` | Logout with captured access token when available |
| `frontend/src/features/auth/components/RegisterForm.tsx` | Optional phone, required workspace, existing 12-character password contract |
| `frontend/src/components/common/UserMenu.tsx` | Safe logout failure logging without raw credential-bearing Axios errors |
| `frontend/src/context/WorkspaceContext.tsx`, `layouts/FamilyLayout/FamilyTopbar.tsx` | Remove demo workspace identity |
| `frontend/src/hooks/usePersistentState.ts` | Eliminate previous-key display/update leakage |
| `frontend/src/layouts/WorkspaceLayout.tsx` | Scoped outlet lifecycle, API notifications, permission-gated event creation |
| `frontend/src/features/dashboard/api/dashboardApi.ts`, `features/dashboard/useDashboard.ts` | Cancellable API query keyed by user/membership; returned-user consistency check |
| `frontend/src/features/events/api/eventsApi.ts`, `features/events/hooks/useEvents.ts` | API-backed event queries, creation and deletion; no mock event initialization |
| `frontend/src/pages/workspace/WorkspacePages.tsx` | Real dashboard summary, empty/error/loading states, actual booking name/reference, staff action permission checks |
| `frontend/src/pages/catalog/CatalogPages.tsx` | Remove seed records and fake success notices; scope data; real notifications; preserve MFA challenge transition; label samples |
| `frontend/src/data/workspaceData.ts` | Retain formatters; remove unused demo business arrays |
| `frontend/src/tests/auth.test.tsx`, `src/tests/http-session.test.ts` | Eighteen frontend cases including races, protected routes, forms, logout and scope changes |
| `frontend/package.json`, `package-lock.json`, `vitest.config.ts`, `playwright.config.cjs` | Test commands and locked test dependencies/configuration |
| `frontend/tests/browser/auth.spec.cjs`, `tests/run-e2e.py`, `tests/requirements-e2e.txt` | Five real Chrome tests; fresh disposable servers/databases; owned-process cleanup; pinned test-runner psutil prerequisite |

No model or migration changes were needed. Historical migrations were not edited.

## 4. Registration flow verification

Backend tests cover successful registration, duplicate email rejection, unverified-login rejection, role-specific workspaces, privileged-role injection rejection, whitespace-only required fields, password hashing, and no OTP/password in registration responses. Workspace/vendor invitations remain email-bound and owner-authorized.

The browser test submits the actual registration form for a fresh synthetic account, reads its delivered OTP from a private test email inbox, submits that code to the genuine verification endpoint, and reaches a correctly named empty family dashboard. The inbox substitutes email transport only; no verification endpoint, OTP comparison, or MFA requirement is bypassed. No demo business records are auto-created.

## 5. Login and OTP/MFA verification

The complete backend suite covers valid login, unverified accounts, expired access, disabled accounts, refresh rotation, revoked sessions, OTP attempt limits/resend cooldown, reset-code consumption, password-reset session revocation, and rate-limit security events.

`test_super_admin_login_and_dashboard` exercises an actual administrator password login, denies dashboard access with the MFA challenge token, enrolls TOTP, verifies a generated TOTP, obtains the full session, and verifies recovery-code behavior. Frontend tests separately prove a stale restoration cannot erase a newly established MFA challenge. Browser login uses the real backend, not mocked authentication.

Existing pages/routes for verification, forgot/reset password, admin MFA, unauthorized access, memberships/onboarding, profile settings, and session management are retained. Session expiry clears protected context and routes to login. Multi-workspace selection still uses the server's membership-switch endpoint.

## 6. Role-based permission matrix

| Role/context | Established enforcement and verified boundary |
|---|---|
| Family Owner | Own workspace/events; workspace membership and invitation administration |
| Family Member | Active membership and individually granted permissions; no owner membership administration |
| Planner | Own planner profile and explicitly assigned family memberships/permissions; no unrelated family access |
| Vendor Owner | Own business, services, staff invitations and permitted booking lifecycle |
| Vendor Staff | Active business membership, explicit permissions and assigned bookings; cannot administer owner resources or arbitrary bookings |
| Admin | Persisted `User.role == admin`, full MFA session, protected administrative APIs |
| Super Admin | Existing session presentation alias `activeRole == super_admin` for the same persisted administrator authority; tested as such |
| Guest | Invitation-token access, hash-backed storage, revocation, deadline checks and owner-only explicit reissue |

The repository has **one administrator authority**, not two independently persisted Admin/Super Admin privilege tiers. This task does not invent a second hierarchy or claim separation between those aliases. A future requirement for different powers needs an explicit policy and implementation.

Family/vendor roles are scoped memberships, not merely the global user role. Negative tests exercise cross-workspace reads, forged/removed memberships, planner assignment and vendor-staff boundaries. Backend guards remain authoritative; frontend navigation/actions also respect permissions. T005 ordinary rotation/revocation and owner-only reissue behavior passes unchanged.

## 7. Logout verification

Visible account-menu logout remains available. Frontend tests verify immediate private-state/cache clearing, a server call for cookie-only restoration, honest revocation-error handling, expiry handling and protected-route denial. Browser testing verifies real logout, rejection of the old access token with HTTP 401, browser back redirect to login, and subsequent login as another account without the first account's identity/event.

Backend policy is current-session logout: its persistent session is revoked and authentication cookies cleared. Other sessions remain active unless explicitly revoked using session management or invalidated by password/security changes. Logout is not represented as successful server revocation when a network/server failure prevents confirmation.

## 8. Dashboard identity verification

Synthetic Alice sees “Good morning, Alice” and her private event. After logout, Bob sees “Good morning, Bob,” no Alice event and an empty workspace. A separate newly registered Nila sees her own empty dashboard. These are real-browser/HTTP checks. Unit tests additionally resolve old account restoration/refresh requests after transitions to test the race conditions deterministically.

Backend dashboard tests assert returned user IDs, selected workspace, independently permission-scoped metrics, per-user notifications, no-store caching, and zero records in an empty account. Dashboard query keys include user ID and membership ID.

## 9. Demo-data removal findings

Removed displayed catalog seed lists, fabricated notifications and fixed-date notification content; replaced the mock-dependent event hook and static dashboard spending/counts. Booking details now use the actual event name and booking ID. The old mock-events fixture file is unreferenced by the runtime hook and does not seed real accounts.

Sample invitation artwork and example input placeholders remain clearly identified as samples/examples. Empty workspaces show empty states. Local planning checklist data is browser-local, scoped to user/membership and cleared on authentication changes; it is not presented as a server-generated business record.

Catalog actions without implemented server workflows now say they are unavailable and do not claim persistence. The unconnected public contact form explicitly says its message was not submitted. Unsupported report/issue metrics are not claimed as real observations; `/dashboard/admin` reports `reportedIssues: null` instead of a fabricated zero. Such unfinished product workflows remain outside the verified authentication capabilities.

## 10. API integration verification

Existing `/api/v1` contracts, JWT/session models, refresh cookies, CORS and CSRF architecture are retained. Browser tests use separate origins on `127.0.0.1:5174` and `127.0.0.1:5001`, demonstrating real CORS and cookie/CSRF integration in the isolated configuration. This does not verify production-domain TLS/CORS settings.

Access tokens stay in memory; refresh cookies retain the existing HttpOnly behavior. Stale account responses are canceled; refresh cannot silently replace the current identity/membership. Dashboard and event query functions accept cancellation signals. Dashboard failures show retry/error states, rather than fabricated successful totals.

Intentional response changes: dashboard responses add authenticated user/scoped summaries and notifications, spending now means actual paid expenses, alias routes correctly resolve the active membership, and the unsupported admin issue count is nullable. No auth endpoint was renamed and no credential or session contract was replaced.

## 11. Backend results

**109 passed, 8 warnings, 66.99 seconds; exit 0.** No skipped tests or weakened security assertions. The warnings are existing Flask-SQLAlchemy `get_engine` deprecations in migration hosting.

Run from `D:\UTSAV\.tox\t008_264f2fa2\backend`:

```powershell
& 'D:/UTSAV/backend/instance/utsav_t005_9k3sem3q/isolated-python/Scripts/python.exe' -m pytest tests -q --basetemp='D:/UTSAV/.tox/t008_264f2fa2/pytest-final'
```

[Complete backend output](../.tox/t008_264f2fa2/backend-final.log). This includes authentication, administration, bookings, budget, events, guests, invitations/RSVP, payments, quotations, uploads/FileAsset, vendor menus/staff and workspace regressions.

The suite configures all **47 SQLAlchemy mappers**, verifies reciprocal relationships, compares migrated metadata including types/server defaults with **no drift**, exercises FileAsset uploader RESTRICT with loaded/unloaded relationships, and checks populated forward migrations/legacy token continuity. Current test revision is `e5c0a3b7f912`; no new migration ID exists for T008. Application startup and real API requests succeed on that migrated test schema.

All write tests use temporary migrated databases. Fixtures verify the resolved SQLite target and `foreign_keys=1`; teardown checks `integrity_check == ok` and no foreign-key violations. They do not rely exclusively on `create_all` or call `drop_all` on the original database.

## 12. Frontend tests and build

Run from `D:\UTSAV\.tox\t008_264f2fa2\frontend`:

```powershell
npm.cmd test -- --reporter=dot
npm.cmd run build
$env:T008_PYTHON='D:/UTSAV/backend/instance/utsav_t005_9k3sem3q/isolated-python/Scripts/python.exe'
npm.cmd run test:browser
```

The browser runner uses installed Chrome, Node, the explicit isolated backend Python, and host Python with `psutil==7.2.2` (declared in `tests/requirements-e2e.txt`). It refuses occupied test ports, creates a new database directory each run, verifies the database path, and stops only its own spawned process trees.

| Verification | Final result | Evidence |
|---|---|---|
| Vitest/Testing Library | 18 passed, 2 files, exit 0 | [Output](../.tox/t008_264f2fa2/frontend-final-tests.log) |
| TypeScript + Vite production build | Passed, exit 0, Vite 4.25 seconds | [Output](../.tox/t008_264f2fa2/frontend-final-build.log) |
| Real Chrome browser tests | 5 passed in 47.3 seconds, exit 0 | [Output](../.tox/t008_264f2fa2/browser-final.log), [JSON](../.tox/t008_264f2fa2/browser-results.json) |
| Responsive dashboard | 360, 768 and 1440 px; no horizontal overflow | [Mobile](../.tox/t008_264f2fa2/browser-dashboard-360.png), [tablet](../.tox/t008_264f2fa2/browser-dashboard-768.png), [desktop](../.tox/t008_264f2fa2/browser-dashboard-1440.png) |

Earlier browser runs exposed test URL/history assumptions and orphaned disposable test servers. The history test now navigates through actual protected routes before logout; the runner uses fresh databases, occupied-port refusal and owned-process-tree cleanup. No assertions accepting leaked protected content were substituted. A backend test initially expected 403 for a forged membership; inspection confirmed the established concealment contract is 404, and the regression asserts 404 plus absence of dashboard data. Earlier failure output remains in the isolated evidence directory; final results above are the corrected, complete runs.

## 13. Security results and original-data safety

Passing coverage includes password hashing, JWT expiry, disabled accounts, current-session revocation, refresh rotation/replay denial, CSRF/trusted-origin checks, OTP limits, TOTP/recovery flow, role injection, owner/member/planner isolation, vendor boundaries, admin endpoint denial, invitation token hashing/revocation/reissue, and asynchronous account-cache isolation. Synthetic test secrets are not included in this report; JWT-shaped values in retained top-level logs are redacted. Browser tracing is disabled. No production secret/environment file was modified or included in the source archive.

[Before](../.tox/t008_264f2fa2/t008-safety-before.json) and [after](../.tox/t008_264f2fa2/t008-safety-after.json) read-only evidence matches exactly:

| File | SHA-256 | Size / modification time |
|---|---|---|
| Original `backend/instance/utsav.db` | `e57707a86311b42d0a8c0c76ccd02c1ba58bfa79b89a613b4c6bb86835068864` | 700416 bytes; `mtime_ns=1794535861310146700`, unchanged |
| Existing pre-T002 backup | `21fab206b7e5677e5106fd6e789fea03f9f13f779ae7ea9a6cc40f20a37464a7` | 700416 bytes; `mtime_ns=1794539239745416600`, unchanged |

Both retain integrity `ok`, no FK violations, original schema/version contents, DELETE journal mode and no sidecars. All 433 monitored original code/config files match their pre-T008 hashes. No live stamp, upgrade, downgrade, restore, database-path change, backup overwrite or business-data reset occurred.

## 14. Remaining issues and limits

The patch is implemented and tested but **not installed in the active source tree or deployed**. Applying it while the existing watchdog runs would implicitly restart the backend. Integration therefore belongs to a controlled maintenance/deployment operation, not this task.

Separate Admin/Super Admin tiers are not an existing capability; the alias behavior is documented above. Phone login/SMS, unsupported catalog/contact workflows, production email delivery, production HTTPS cookie attributes, production rate-limit infrastructure, and real payment-provider settlement are not certified by local synthetic tests. Existing migration-host deprecation warnings remain. These limits must not be mistaken for passing live integration checks.

## 15. T007 dependencies and recommendation

The original database is still the pre-cutover schema with an empty Alembic version table; the current application expects migrated auth/session and other schema additions. Live login, registration, refresh/MFA, scoped dashboards and related migrated-table workflows remain **BLOCKED pending authorized T007 preparation/cutover**. Nothing here repairs that by modifying the original database.

The previously verified T006/T007 release hashes do not cover this T008 implementation. Before deployment, integrate the reviewed patch during an authorized maintenance window, produce a new pinned release artifact, refresh its writer inventory/rollback pairing, and rerun the full disposable migration rehearsal for that exact artifact. Do not substitute this code into an already hashed deployment plan silently. T007 Phase C remains unauthorized.

The safe T008 implementation and isolated verification are complete. Live readiness is not asserted.
