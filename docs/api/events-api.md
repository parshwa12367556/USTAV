# Events API

Base URL: `/api/v1`. All event and function routes require authentication. Resource access is filtered by the authenticated user’s active family membership and permission; an ID alone does not grant access.

| Method | Path | Purpose | Required permission |
|---|---|---|---|
| GET | `/events` | List accessible events | `event.view` |
| POST | `/events` | Create event in authorized family workspace | `event.create` (owner behavior applies) |
| GET | `/events/<event_id>` | Retrieve event | `event.view` |
| PATCH | `/events/<event_id>` | Update event | `event.update` |
| DELETE | `/events/<event_id>` | Delete event and cascaded records | `event.delete` |
| GET | `/events/<event_id>/functions` | List event functions | `event.view` |
| POST | `/events/<event_id>/functions` | Create an event function | `function.manage` |
| PATCH | `/functions/<function_id>` | Update a function | `function.manage` |
| DELETE | `/functions/<function_id>` | Delete a function | `function.manage` |

## Event fields

Request schemas accept event name/type/date and optional end date, venue, location, guest count, budget, status, and description. End date cannot precede start date. Function fields include event ID (path-scoped), name, date, venue, guest count, and notes. See `backend/app/schemas/event_schema.py`.

## Authorization notes

The backend scopes each event against owner/workspace membership, active membership status, and requested permission. Functions are checked against the parent event. Unauthorized or absent event IDs may return 404.

## Related endpoints

Guest, budget, quotation, booking, invitation, and payment APIs use event IDs and enforce their own permission strings. Consult [guests API](guests-api.md) and [bookings API](bookings-api.md).