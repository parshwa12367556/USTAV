# Vendor module

## Capabilities

Vendor accounts and profiles support business identity/category/city/address, verification state, services, packages, portfolios, availability, menus, quotations, bookings, and staff collaboration.

Public catalogue queries return verified/active vendor information. Private management endpoints are authenticated and owner-scoped. Staff access is modeled through vendor memberships, permissions, and assignments and is not equivalent to vendor ownership.

## Staff workflow

Vendor owners may create and revoke staff invitations, acceptances create vendor staff membership, and owners can assign staff to bookings. Staff booking access is constrained by membership and assignments; owner-only profile and catalogue controls must remain unavailable to staff.

## Data

Business names, category, city/address, description, price, ratings/count, services and portfolio URLs, availability, verification status, staff email/membership, bookings, and quotations. Treat private address and staff contact data as non-public.

## API and implementation

See [vendor API](../api/vendors-api.md). Routes are in `backend/app/api/vendor_routes.py` and `vendor_staff_routes.py`; models are in `vendor.py` and `vendor_staff.py`.

## Caveats

Marketplace operation depends on admin verification and configured categories. The existence of catalogue UI does not prove every service/catalogue operation is wired end-to-end. Validate each edit flow and public/private serializer before release.