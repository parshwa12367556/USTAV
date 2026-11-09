# Venue module

## Current implementation

Venue records may include an optional vendor owner, name, city, capacity, price per day, amenities, image URL, and active state. Date-specific availability is stored separately with a unique venue/date constraint.

## API

- `GET /api/v1/venues`: list active venues; optional city, minimum-capacity, maximum-price filters.
- `GET /api/v1/venues/<venue_id>`: active venue details and available dates.
- `GET /api/v1/venues/<venue_id>/availability`: availability rows.
- `PUT /api/v1/venues/<venue_id>/availability`: authenticated owner updates availability dates.

The owner route must validate that the venue belongs to the caller’s vendor profile. Admin venue creation is handled through the admin API.

## Limitations

The repository supports catalogue/availability data. It does not by itself prove a full venue booking/contract workflow, external calendar synchronization, or live inventory locking. Test concurrent updates and double-booking safeguards before relying on availability operationally.

## Data and privacy

Venue location, capacity, amenities, pricing, imagery, and availability are stored. Confirm whether location is public and whether uploaded image URLs use durable, access-controlled storage.