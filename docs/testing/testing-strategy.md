# Testing strategy

## Test layers

### Backend

Pytest tests live in `backend/tests` and use the Flask test client plus isolated SQLite databases from `conftest.py`. The suite covers auth/MFA/session behavior, workspace authorization, events, guests/RSVP, vendor staff, vendor menus, bookings, quotations, budgets, payments, invitations, uploads, admin behavior, and health endpoints.

Run all backend tests:

```powershell
Set-Location D:\UTSAV\backend
python -m pytest
```

Run focused suites:

```powershell
python -m pytest tests/test_auth.py tests/test_workspace.py tests/test_guests.py tests/test_rsvp.py
python -m pytest tests/test_vendor_staff.py tests/test_bookings.py tests/test_quotations.py
```

### Frontend

Run:

```powershell
Set-Location D:\UTSAV\frontend
npm ci
npm run build
```

The build performs TypeScript project checks and Vite bundling. `frontend/package.json` currently declares no unit-test or lint script; do not report frontend test coverage unless added separately.

## Security test practices

- Use direct API requests and assert backend denial; frontend-hidden buttons are not a security test.
- Create at least two independent workspaces/vendors and assert cross-tenant access fails.
- Test owner, view-only member, edit member, assigned planner, vendor owner/staff, anonymous guest, and admin roles separately.
- Test positive as well as negative paths; legitimate invitation and RSVP workflows must remain usable.
- Assert secret fields are absent from list/create/update/import/export responses and error output.
- Test token expiry/revocation/rotation and refresh replay.
- Use only disposable test databases and synthetic data; never point tests at project or production data.

## External integrations

SMTP and Razorpay test doubles do not prove live provider connectivity. Run controlled staging/sandbox checks for mail delivery, webhook signatures, checkout, retries, and failure paths. Never put live secrets or cardholder data in test fixtures.

## Migrations

For schema changes, test upgrade from the previous revision, current schema integrity, fresh database setup, and downgrade only on disposable copies. Production downgrade may destroy data; prepare restore procedures rather than blindly downgrading.

## CI recommendations

Run Python tests, frontend build, dependency audits, secret scanning, migration checks, and static analysis on clean lockfiles for every pull request. Preserve logs without exposing tokens or personal data.

## Reporting

Report exact command, commit, test count/result, skipped tests, environment assumptions, and known gaps. A test pass proves only the tested cases.