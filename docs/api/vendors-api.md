# Vendors and venues API

Base URL: `/api/v1`. Public catalogue endpoints expose only approved/active listing data as filtered by route logic. Private management endpoints require authentication and must be scoped to the owner’s vendor profile/membership.

## Vendor routes (`/vendors`)

| Method | Path | Purpose |
|---|---|---|
| GET | `/vendors` | Search/list verified vendors; filters include category, city, search |
| GET | `/vendors/<vendor_id>` | Public verified vendor details and active offerings |
| POST | `/vendors/profile` | Create vendor profile during supported workflow |
| GET | `/vendors/profile/me` | Current vendor profile |
| PATCH | `/vendors/profile/me` | Update own vendor profile |
| GET/POST | `/vendors/profile/me/services` | List/create services |
| PATCH/DELETE | `/vendors/services/<service_id>` | Update/delete own service |
| GET/POST | `/vendors/profile/me/packages` | List/create packages |
| PATCH/DELETE | `/vendors/packages/<package_id>` | Update/delete own package |
| GET/POST | `/vendors/profile/me/portfolio` | List/add portfolio entries |
| DELETE | `/vendors/portfolio/<item_id>` | Remove own portfolio entry |
| GET/PUT | `/vendors/profile/me/availability` | Read/update availability |
| DELETE | `/vendors/profile/me/availability/<availability_id>` | Remove availability |
| GET | `/vendors/<vendor_id>/services` | Public active services |
| GET/POST | `/vendors/<vendor_id>/menus` | Read or manage catering menus (write authorization applies) |
| POST | `/vendors/<vendor_id>/services` | Add public-facing offering through vendor flow |

Exact route decorators and schemas are authoritative; route variants may enforce additional ownership or verification checks.

## Staff routes (`/vendors`)

- `GET /profile/me/staff`: list staff (owner).
- `GET /profile/me/staff/invitations`: list invitations (owner).
- `POST /profile/me/staff/invitations`: create staff invitation (owner).
- `DELETE /profile/me/staff/invitations/<invitation_id>`: revoke invitation (owner).
- `POST /staff/invitations/accept`: accept with token and invited identity.
- `DELETE /profile/me/staff/<membership_id>`: remove staff member (owner).
- `GET /staff/me/bookings`: list staff-available assigned bookings.
- `POST /profile/me/bookings/<booking_id>/assignments`: assign staff (owner).
- `DELETE /profile/me/bookings/<booking_id>/assignments/<membership_id>`: remove assignment (owner).

## Venue routes (`/venues`)

- `GET /venues`, `GET /venues/<venue_id>`, `GET /venues/<venue_id>/availability`: public active catalogue reads.
- `PUT /venues/<venue_id>/availability`: authenticated vendor owner update.

Vendor and venue list data may include business name, category, city, public descriptions, prices, and availability. Do not expose private business credentials or staff data in public serializers.