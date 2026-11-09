# UTSAV documentation

This documentation describes the current repository implementation. A described route or feature should not be read as proof of deployment readiness: production settings, provider accounts, legal approvals, and hosted infrastructure must be verified separately.

## Project overview

- [Vision](project-overview/vision.md), [problem statement](project-overview/problem-statement.md), [objectives](project-overview/objectives.md), and [scope](project-overview/scope.md)
- [System architecture](architecture/system-architecture.md), [backend](architecture/backend-architecture.md), [frontend](architecture/frontend-architecture.md), [deployment architecture](architecture/deployment-architecture.md), [mobile architecture status](architecture/mobile-architecture.md)
- [Database design](database/database-design.md), [data dictionary](database/data-dictionary.md), [entity relationships](database/er-diagram.md)

## Implementation guides

- Modules: [guests and RSVP](modules/guest-module.md), [invitations](modules/invitation-module.md), [vendors](modules/vendor-module.md), [venues](modules/venue-module.md), [catering](modules/catering-module.md), [decoration](modules/decoration-module.md), [payments](modules/payment-module.md)
- API: [conventions](api/api-conventions.md), [authentication](api/authentication-api.md), [events](api/events-api.md), [guests](api/guests-api.md), [bookings](api/bookings-api.md), [vendors](api/vendors-api.md)
- Security: [authentication and sessions](security/authentication-security.md), [authorization](security/authorization.md), [privacy requirements](security/privacy-policy-requirements.md), [release checklist](security/security-checklist.md)
- Operations: [local setup](deployment/local-setup.md), [production deployment](deployment/production-deployment.md), [backup strategy](deployment/backup-strategy.md)
- Quality: [testing strategy](testing/testing-strategy.md), [test cases](testing/test-cases.md), [bug report template](testing/bug-report-template.md)

## Source of truth

The implementation is in `backend/app` and `frontend/src`; automated backend tests are in `backend/tests`. When documentation and code disagree, treat code and tests as current behavior, then update this documentation as part of the change. Do not copy real credentials, production URLs, user data, or secret values into documentation.

## Status labels used here

- **Implemented**: current source contains the behavior; tests may or may not cover it.
- **Tested**: an automated test exists for at least the named scenario. Run it before relying on the result.
- **Requires configuration**: code exists but needs provider or environment setup.
- **Not implemented / not verified**: no evidence in this repository that the behavior is available or deployed.
