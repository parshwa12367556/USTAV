# UTSAV vision

## Product direction

UTSAV is a web application for planning wedding and celebration events. It aims to bring event details, guests, service providers, venue selection, budgets, bookings, invitations, and payment records into a single workspace.

## Intended users

- Families and event owners organizing a celebration.
- Family members and wedding planners invited into a family workspace with explicitly granted permissions.
- Vendors managing their business profile, services, packages, availability, and bookings.
- Vendor staff collaborating on assigned bookings.
- Platform administrators managing marketplace operations and security.
- Guests using invitation links to view event details and submit RSVPs.

## Product principles

1. A workspace is the boundary for private event-planning data.
2. Role and permission decisions are made by the backend, not merely by frontend navigation.
3. Guest and workspace invitations are bearer links; share them only with intended recipients.
4. Payment processing should remain with the configured provider; the application records payment and transaction metadata.
5. Public-facing documentation and privacy terms must reflect actual deployed behavior and be approved before launch.

## Current status

The repository contains a React/TypeScript frontend and Flask/SQLAlchemy API with broad MVP functionality and backend tests. This is not a statement that all flows are production-ready: deployment infrastructure, live provider setup, full browser end-to-end coverage, accessibility conformance, and legal approvals are external or still require validation.