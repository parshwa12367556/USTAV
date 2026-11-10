# UTSAV Invitation Token Security

## Token Generation

- `generate_bearer_token()` uses `secrets.token_urlsafe(32)` → 256 bits of entropy
- Output is URL-safe base64-encoded random string
- Unpredictable and non-sequential

## Token Hashing

- `hash_bearer_token()` uses `hashlib.sha256()` → one-way hash
- Produces 64-character hexadecimal string
- Stored in database `invitation_token_hash` column (unique)
- Raw token never stored in database
- Raw token returned ONLY in API responses for link generation

## Token Expiry

- `INVITATION_TOKEN_EXPIRY_DAYS` config (default: 90 days)
- Stored as `invitation_expires_at` on Guest model
- Backend validation in `_guest_for_token()`
- Timezone-aware comparison using UTC

## Token Revocation

- `revoke_guest_invitation_token()` sets `invitation_revoked_at = now` and `invitation_expires_at = now`
- Revoked tokens immediately rejected (410 status)
- `_guest_for_token()` checks `guest.invitation_revoked_at is not None`
- Error message: "This invitation is no longer available." (410)

## Token Rotation

- `rotate_guest_invitation_token()` generates new bearer token
- Hashes new token and stores in `invitation_token_hash`
- Preserves revocation state (if previously revoked, remains revoked)
- Sets new `invitation_expires_at`
- Returns new token in API response
- Old token immediately rejected (hash mismatch)

## Public Invitation Page

- Route: `/invitation/:token` (frontend) / `/api/v1/invitations/public/lookup` (API)
- Token validation: hash comparison, expiry, revocation check
- Enumeration protection: 404 on all failed lookups
- Rate limiting: fingerprint-based + IP-based
- No raw token exposure in responses or logs

## API Endpoints

| Endpoint | Method | Auth | Security Features |
|---|---|---|---|
| `/api/v1/invitations/public/lookup` | POST | none | Rate-limited, hash comparison, expiry, revocation check |
| `/api/v1/guests/{id}/invitation-token/rotate` | POST | jwt_required | New token, hash, expiry, revocation state preserved |
| `/api/v1/guests/{id}/invitation-token/revoke` | POST | jwt_required | Sets revoked_at and expires_at, immediate rejection |
| `/api/v1/invitations` | POST | jwt_required | Create invitation with share_token_hash (hashed) |

## Compliance Checklist

- [x] Cryptographically secure token generation (256-bit entropy)
- [x] Token hashing before database storage (SHA-256)
- [x] Raw token never returned in list/detail APIs
- [x] Raw token never in application logs
- [x] Configurable invitation expiry
- [x] Backend expiry validation (not frontend-only)
- [x] Revocation validation with immediate effect
- [x] Token rotation preserves revocation state
- [x] Public invitation page enumeration protection (404 on failed)
- [x] Rate limiting on public endpoints (fingerprint-based)
- [ ] Constant-time token comparison (hmac.compare_digest recommended)
- [ ] Per-invitation expiry override
- [ ] Token usage tracking for abuse detection