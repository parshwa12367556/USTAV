# Guests and RSVP API

Base URL: `/api/v1`. Guest management endpoints require authentication and are scoped to an accessible event. Guests do not sign in for the RSVP flow: possessing a valid RSVP invitation token grants access to the public invitation and RSVP operations.

| Method | Path | Purpose | Permission |
|---|---|---|---|
| GET | `/events/<event_id>/guests` | List guests | `guest.view` |
| POST | `/events/<event_id>/guests` | Create guest | `guest.create` |
| POST | `/events/<event_id>/guests/import-csv` | Import guests | `guest.create` |
| GET | `/events/<event_id>/guest-groups` | List guest groups | `guest.view` |
| POST | `/events/<event_id>/guest-groups` | Create group | `guest.create` |
| PATCH | `/guest-groups/<group_id>` | Rename group | `guest.update` |
| DELETE | `/guest-groups/<group_id>` | Delete group | `guest.delete` |
| PATCH | `/guests/<guest_id>` | Update guest | `guest.update` |
| GET | `/guests/<guest_id>/functions` | Get assigned function IDs | `guest.view` |
| PUT | `/guests/<guest_id>/functions` | Set function assignments | `guest.update` |
| DELETE | `/guests/<guest_id>` | Delete guest | `guest.delete` |
| GET | `/guests/<guest_id>/invitation-token` | Retrieve RSVP bearer token | `guest.update` |
| POST | `/guests/<guest_id>/invitation-token/rotate` | Rotate/revoke previous token | `guest.update` |
| GET | `/rsvp/<token>` | Retrieve public invitation details | Valid, unexpired token |
| POST | `/rsvp` | Create or update RSVP | Valid, unexpired token in body |

There is no standalone GET guest-detail endpoint in the current API. Guest detail is available through the event-scoped list.

## Token handling

Ordinary guest serializers and schemas omit `invitationToken`. Only the explicit get-token and rotate routes return the raw bearer token, and both require `guest.update` for that guest’s event. Guest tokens are currently stored in the Guest row as raw values, not hashes; database/backup access therefore exposes active bearer credentials. Do not log them or include them in normal exports.

Tokens expire after `INVITATION_TOKEN_EXPIRY_DAYS` (90 days by default). Rotation replaces the previous token and resets expiry; old links stop resolving. There is no separate revoke route; rotating or deleting the guest invalidates the old token.

## RSVP request

`POST /rsvp` accepts `invitationToken`, status (`attending`, `declined`, or `maybe`), optional plus-ones (0–20), optional dietary notes (up to 2000 chars), and optional function IDs. Selected functions must be assigned to that invitation. The API supports repeat submissions/updates while the token is valid.

Do not put the bearer token in analytics, logs, referer-bearing external links, screenshots, or public support tickets. Treat it as a password-equivalent link.