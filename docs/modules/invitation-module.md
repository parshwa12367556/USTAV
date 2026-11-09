# Invitation module

The codebase contains two distinct concepts; do not confuse their tokens or APIs.

## Guest RSVP invitation

An organizer shares a guest-specific public RSVP link. The token is stored on the guest record, expires according to `INVITATION_TOKEN_EXPIRY_DAYS`, and can be rotated by an authorized user. The public route returns limited event/guest information and accepts RSVP changes. See [guest module](guest-module.md).

## Designed event invitation

Invitation templates can be listed publicly. Authenticated event workspaces can create invitations, publish/update status, and retrieve published invitations through an expiring share token. Route implementation is in `backend/app/api/invitation_routes.py`; the public read route is `/api/v1/invitations/public/<share_token>`. Private invitation list/create/update use event permission checks (`invitation.view`, `invitation.create`, `invitation.update`).

## Family workspace and vendor staff invitations

These are account/membership onboarding links rather than event invitations. Family workspace and vendor staff invitation tokens are hashed in storage, email-bound, expiring, and revocable under owner authorization. Acceptance validates the token and identity/account rules. Routes are in `workspace_routes.py` and `vendor_staff_routes.py`.

## Security and operations

Tokens are credentials, not tracking IDs. Do not expose them in ordinary list/detail responses, logs, analytics, screenshots, or public support tickets. Apply short appropriate expiration, token rotation, one-time acceptance semantics, and rate limits. Verify behavior through direct API tests for wrong email, expired/revoked token, replay, and unauthorized owner.

## Current limitation

Workspace and vendor invitation links are returned to an authorized caller for manual sharing; code documentation should not imply automatic email delivery unless a workflow is added.