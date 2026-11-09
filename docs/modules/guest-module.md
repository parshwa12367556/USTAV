# Guest and RSVP module

## Capabilities

- Create, list, update, and remove guests within an event.
- Import guests from CSV and organize them in event-scoped groups.
- Assign guests to event functions.
- Share a guest invitation link; rotate the RSVP token to invalidate an old link.
- Let a guest view a limited public invitation and submit/update RSVP status, plus-ones, and optional dietary notes.
- Enforce guest/function assignment and token expiry.

## Authorization

Organizer-side list/create/update/delete and token actions are protected by event membership permissions: `guest.view`, `guest.create`, `guest.update`, and `guest.delete`. Public RSVP is token-authorized. The token is a bearer secret; anyone possessing it can use the guest workflow until it expires or is rotated.

Ordinary serializers omit the raw token. Dedicated token retrieval and rotation require `guest.update`. Guest token values are stored raw in the `guests` table; this is a residual database-at-rest risk. Exports must never include tokens.

## API

See [guests API](../api/guests-api.md). Important endpoints include `/events/<event_id>/guests`, `/events/<event_id>/guests/import-csv`, `/guests/<guest_id>/functions`, `/guests/<guest_id>/invitation-token`, `/guests/<guest_id>/invitation-token/rotate`, and `/rsvp`.

## Data handled

Name, email, phone, group, event-function assignment, RSVP status, plus-one count, and optional dietary notes. Do not collect sensitive dietary/health details unless necessary; no separate health-data protection workflow is documented.

## Verification

`backend/tests/test_guests.py`, `backend/tests/test_rsvp.py`, and `backend/tests/test_workspace.py` cover guest operations, RSVP, expiry/rotation, function scope, and membership permissions. Run these after changes. Manual frontend checks should test link sharing, clipboard permissions, token expiry UI, and copy/renew access for view-only versus edit members.