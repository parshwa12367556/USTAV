# Bug and security report template

Use synthetic accounts/data. Never paste passwords, access/refresh tokens, RSVP links, recovery codes, API keys, personal information, or payment data into a ticket.

## Summary

- **Title:**
- **Type:** Bug / Security / Privacy / Accessibility / Performance
- **Severity and rationale:**
- **Affected version/commit:**
- **Reporter/contact:**
- **Date/time and timezone:**

## Environment

- Browser/OS or API client:
- Frontend/API versions:
- Environment (local/test/staging/production; do not include secret values):
- Relevant configuration names (redact values):

## Reproduction

1.
2.
3.

Use synthetic IDs, redact authorization headers, and avoid reproducing on production if the test can alter or expose real data.

## Expected and actual behavior

- **Expected:**
- **Actual:**
- **HTTP status/message (redacted):**

## Impact and scope

- Affected roles/permissions:
- Affected workspace/tenant boundaries:
- Data or action exposed (describe categories, not the actual records):
- Does the issue require authentication or a bearer invitation link?
- Confirmed versus suspected:

## Evidence

Attach redacted logs/screenshots or minimal reproduction only. Remove cookies, JWTs, invitation URLs/tokens, email addresses, names, phone numbers, and payment identifiers. Include relevant file/line or test name where known.

## Validation and remediation

- Reproduction test added:
- Fix/mitigation:
- Regression tests run and results:
- Remaining risks:
- Disclosure/incident process followed (if applicable):