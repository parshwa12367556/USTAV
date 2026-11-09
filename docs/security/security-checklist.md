# Security release checklist

Use this checklist for each release. Record evidence, owner, date, and exceptions in the release process; a checked item without evidence is not verification.

## Application

- [ ] Run backend test suite and frontend production build.
- [ ] Run migration upgrade on a copy/disposable database and verify rollback strategy.
- [ ] Review every new endpoint for authentication, tenant scoping, permission checks, validation, and safe response serialization.
- [ ] Test cross-account and cross-workspace access with direct HTTP requests.
- [ ] Confirm RSVP and workspace/vendor invitations expire, rotate/revoke, and do not leak bearer credentials.
- [ ] Verify login, OTP, reset, refresh, MFA, and invitation rate limits.
- [ ] Verify CSRF, Origin, cookie scope, access-token expiry, refresh rotation, logout, and session revocation.
- [ ] Inspect uploads for extension, signature, size, generated names, storage access, and malware-handling requirements.
- [ ] Search source, build artifacts, docs, and Git changes for secrets, tokens, private data, debug output, and unsafe logs.
- [ ] Check security headers, CORS allowlist, error responses, and `Cache-Control: no-store`.

## Dependencies and supply chain

- [ ] Run npm dependency audit and Python dependency audit in CI.
- [ ] Review direct/transitive findings, unsupported packages, lockfiles, license policy, and update plan.
- [ ] Build from clean lockfiles in a controlled CI job.

## Deployment

- [ ] Confirm HTTPS, secure cookies, trusted proxy settings, exact CORS origins, and production environment selection.
- [ ] Confirm secrets are supplied via secret management and are distinct, strong, and rotated as required.
- [ ] Confirm shared rate-limit backend, database least privilege, private network exposure, and durable upload storage.
- [ ] Verify production SMTP/payment settings and webhook signature validation.
- [ ] Verify centralized logs exclude secrets and define retention/access controls.
- [ ] Verify monitoring, alerting, backup schedule, restore drill, and incident-response contacts.

## Privacy/accessibility

- [ ] Approve privacy notice/terms and confirm they reflect live data flows and processors.
- [ ] Verify consent/rights workflows, deletion/retention, data export, and support contact.
- [ ] Review accessibility with automated and manual keyboard/screen-reader/contrast tests.

## Evidence

Record release commit, test output, dependency audit output, migration result, deployment configuration review, backup restore evidence, and accepted risks. Items depending on hosting or legal decisions must be verified by the responsible operator; repository inspection alone cannot prove them.