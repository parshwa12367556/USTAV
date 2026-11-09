# Test case catalogue

This catalogue identifies high-value scenarios. Existing automated coverage is in `backend/tests`; run the suite to verify the current state. “Manual” scenarios still require browser/provider/deployment execution and are not proven by a unit test.

## Authentication and account lifecycle

| ID | Scenario | Expected result | Coverage |
|---|---|---|---|
| AUTH-01 | Register family, vendor, planner with unique email | Correct account/profile/workspace/membership; verification required | Backend role-specific tests |
| AUTH-02 | Login unverified account or invalid password | Denied without account enumeration | Backend auth tests |
| AUTH-03 | OTP success, expiry, attempt cap, resend cooldown | Only valid unexpired code succeeds | Backend auth tests |
| AUTH-04 | Reset/change password | New password rules enforced; old sessions invalidated | Backend auth tests |
| AUTH-05 | Admin login and TOTP/recovery code | Challenge required; invalid/replayed code denied | Backend admin/auth tests |
| AUTH-06 | Refresh, replay, logout, session revoke | Rotation/revocation enforced | Backend auth tests |
| AUTH-07 | Browser end-to-end login/logout/back navigation | Correct dashboard; private data not restored after logout | Manual browser |

## Workspace authorization and tenant boundaries

| ID | Scenario | Expected result | Coverage |
|---|---|---|---|
| AUTHZ-01 | Family owner views/updates own event and guests | Allowed according to owner policy | Backend event/workspace tests |
| AUTHZ-02 | Family member with `guest.view` lists guests | Allowed; no RSVP bearer token or hash returned | Backend workspace/RSVP tests |
| AUTHZ-03 | View-only member requests token, rotates token, edits guest | Denied (typically 404/403) | Backend workspace tests |
| AUTHZ-04 | Member with `guest.update` gets/rotates token | Allowed only in assigned workspace | Backend workspace/RSVP tests |
| AUTHZ-05 | Family A requests Family B event/guest by direct ID | No data returned | Backend workspace isolation tests |
| AUTHZ-06 | Planner in assigned workspace versus unassigned workspace | Assigned permissions only | Backend workspace tests; extend across all routes |
| AUTHZ-07 | Vendor owner/staff requests family event/guest APIs | Denied | Backend tests and role matrix |
| AUTHZ-08 | Vendor staff requests unassigned booking or owner settings | Denied | Backend vendor-staff tests |
| AUTHZ-09 | SUPER_ADMIN guest endpoints | Verify explicit policy; admin role must not implicitly bypass tenant checks | Manual/direct API |

## Guest and invitation lifecycle

| ID | Scenario | Expected result | Coverage |
|---|---|---|---|
| RSVP-01 | Owner creates/list/imports guest | Guest fields returned; no bearer token in generic payload | `test_guests.py`, `test_rsvp.py` |
| RSVP-02 | Authorized guest-link retrieval | Only `guest.update` can retrieve token | Workspace test |
| RSVP-03 | Guest opens invitation and submits RSVP | Valid token permits limited view and RSVP update | `test_rsvp.py` |
| RSVP-04 | Invalid/expired token | 404/410; no mutation | `test_rsvp.py` |
| RSVP-05 | Token rotation | Old token denied; new token usable | `test_rsvp.py` |
| RSVP-06 | RSVP selects a function outside invitation/event | Rejected | `test_rsvp.py` |
| RSVP-07 | CSV export, browser network panel, logs | No bearer token/hash included | Manual inspection |
| RSVP-08 | Direct GET guest detail | No unintended route or data leak | Direct API check |

## Vendor, booking, and money workflows

- Vendor verification and public catalogue visibility.
- Vendor owner CRUD versus staff denied/limited access.
- Staff invitations: wrong email, expired/revoked token, acceptance, removal.
- Booking creation and status transitions; staff assignment and cross-vendor denial.
- Quotation creation, vendor reply, family accept/decline, invalid transitions.
- Budget category/expense validation and tenant isolation.
- Payment checkout only for authorized confirmed booking; signature and webhook invalid/duplicate cases.

Backend suites exist for these areas; live Razorpay/SMTP checks need sandbox accounts.

## Upload and input handling

- Reject missing/unsupported/mismatched image content and oversized requests.
- Use generated server-side file names; verify public file serving does not allow traversal.
- Reject malformed CSV, invalid columns/encoding, and oversized imports.
- Check schema length/range/enum validation and safely escaped frontend rendering.

## Regression policy

When modifying a workflow, run its focused suite and relevant authorization suite, then full backend tests and frontend production build. Document untested environment-dependent behavior explicitly.