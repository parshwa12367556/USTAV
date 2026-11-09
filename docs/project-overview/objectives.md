# Project objectives

## Product objectives

- Let families create and manage events, functions, guest lists, RSVP status, and budgets.
- Support scoped collaboration by family members and assigned wedding planners.
- Let vendors publish profiles, services, packages, menus, portfolios, and availability.
- Support bookings, quotations, staff assignments, and payment workflows.
- Provide role-specific workspaces for family, planner, vendor, staff, and admin users.
- Give invited guests a limited public RSVP experience using an expiring invitation link.

## Engineering objectives

- Enforce authentication, workspace isolation, and permission checks in backend routes.
- Validate API inputs and keep access/refresh tokens out of persistent browser storage.
- Use migrations for schema changes and tests for key business/security behaviors.
- Keep secrets and environment-specific configuration out of committed application code.
- Document which features need external infrastructure or operational configuration.

## How to measure progress

Use automated backend tests, frontend TypeScript/production build, migration checks on disposable databases, and manual browser tests against each supported role. A passing build is not proof of correct authorization, production deployment, privacy compliance, or accessibility.