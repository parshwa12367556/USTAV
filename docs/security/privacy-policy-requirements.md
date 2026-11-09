# Privacy notice and operational requirements

This is an implementation checklist, not a legal policy and not legal advice. A qualified privacy/legal reviewer must determine applicability and approve the final notice for the actual operator, users, locations, and subprocessors.

## Data represented in the application

Depending on user workflow, the backend can process:

- Account identity and contact fields: name, email, phone, role, verification and account status.
- Authentication/security information: password hash, OTP/reset hashes and expiry/attempt metadata, encrypted administrator TOTP seed, recovery-code hashes, session/device/browser/OS/IP metadata, revoked-token identifiers, and security/audit events.
- Family/workspace membership, invited email, role, permissions, planner assignments, and invitation status/expiry.
- Event details: event names/types, dates, locations/venues, descriptions, schedules/functions, budgets, guest counts, and planning records.
- Guest details: names, email, phone, guest group, plus-one count, RSVP status, assigned event functions, and optional dietary notes on RSVP.
- Vendor/business profile, location/address, service/catalogue details, availability, bookings, quotations, and payment/invoice/provider transaction metadata.
- Uploaded image files and metadata/paths.

Do not infer that every deployment collects every field. The production database and live traffic must be assessed separately.

## Notice content to approve

The user-facing policy should clearly identify:

1. The responsible legal entity/controller and privacy contact.
2. Each purpose and applicable legal basis/consent mechanism.
3. Required versus optional fields and consequences of omission.
4. Guest-data sharing and the organizer’s responsibilities.
5. Recipients/processors, including email, payment, storage, hosting, analytics if later added, and support.
6. International transfers and storage region where applicable.
7. Retention periods or criteria, account deletion, backup expiry, and security-log retention.
8. Access, correction, export, deletion, objection/withdrawal, and complaint/request methods.
9. Security practices at an appropriate level, breach contact/communications, and effective date/version.

## Consent and user controls

The UI/API must record meaningful acceptance or other lawful basis where required; merely publishing terms does not establish consent. Provide a clear withdrawal/request process and document exceptions, downstream processor handling, and backup retention. Do not claim these operations exist unless confirmed in deployed workflows.

## Data minimization and security

Review the necessity of phone, event location, guest contact, dietary notes, IP/device metadata, and free-text fields. Avoid collecting sensitive or children’s data unless necessary and protected. Restrict staff access by role, avoid token/secret exposure, encrypt transport, control database/storage access, and use deletion/retention schedules.

## Review cycle

Reconcile this inventory against schemas, models, frontend forms, logs, integrations, analytics, and hosting. Re-review when adding a field, processor, new region, or product purpose.