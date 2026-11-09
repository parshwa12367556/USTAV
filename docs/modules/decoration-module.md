# Decoration module

## Current status

The repository contains generic vendor catalogue, service, package, quotation, and booking capabilities that can represent decoration services. A distinct decoration domain model or dedicated decoration-specific API workflow is not established by current backend models/routes.

## What can be represented

Depending on configured vendor category and generic service fields, a vendor may publish a service/package description and pricing; an organizer may request a quotation or booking. These general capabilities should not be described as a complete decoration-specific module without verified frontend and backend flows.

## Suggested acceptance criteria before calling it complete

- Search/filter decoration vendors by location/category.
- Vendor-controlled packages, inclusions, pricing, photos, and availability.
- Event-scoped quote request, revisions, acceptance, and booking.
- Role-scoped owner/staff access and family workspace isolation.
- Tests covering unauthorized access, validation, and all state transitions.

This document states current implementation boundaries; it does not imply the suggested work exists.