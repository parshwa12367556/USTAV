# UTSAV RSVP Security

## Submission Validation

- Invitation token validated (_guest_for_token checks revocation, expiry, deadline)
- Invitation association enforced (token-bound guest lookup)
- Function selection validated (must belong to event, no duplicates)
- Input size limits enforced (max 100 functionIds, max 20 plusOnes)

## Deadline Enforcement

- Event.rsvp_deadline column added (DateTime, timezone-aware)
- rsvp_deadline_passed property checks UTC comparison
- Backend check in _guest_for_token() returns 410 if exceeded
- Graceful handling when no deadline set

## RSVP Update Security

- Guests can update own RSVP using valid invitation link
- Revoked invitations cannot update RSVP (token rejected)
- Expired invitations cannot update RSVP (deadline check)
- Attendance counts accurate (unique constraint on guest+function)
- Previous history preserved (status updates only, not deletions)

## Rate Limiting

- PUBLIC_RSVP_LOOKUP_LIMIT: 60 per minute
- PUBLIC_RSVP_SUBMIT_LIMIT: 10 per minute
- PUBLIC_RSVP_INVALID_LIMIT: 10 per minute
- PUBLIC_INVALID_TOKEN_LIMIT: 5 per hour (HMAC fingerprint)
- 429 responses with retry information

## Cross-Workspace Isolation

- Guest can only RSVP using their own invitation token
- Family member cannot RSVP using another family's invitation
- Planner cannot RSVP on behalf of guests (must use guest token)
- Different workspace invitations completely isolated