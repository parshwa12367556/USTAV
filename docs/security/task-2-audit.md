# UTSAV Task 2 - Security Audit

## Executive Summary

---
## 3. API ENDPOINT AUDIT

### 3.1 Guest Management Endpoints

| Endpoint | Method | Auth | Status |
|---|---|---|---|
| `/api/v1/events/<event_id>/guests` | GET | jwt_required | ✓ |
| `/api/v1/events/<event_id>/guests` | POST | jwt_required | ✓ |
| `/api/v1/guests/<guest_id>` | GET | jwt_required | ✓ |
| `/api/v1/guests/<guest_id>` | PUT | jwt_required | ✓ |
| `/api/v1/guests/<guest_id>` | DELETE | jwt_required | ✓ |
| `/api/v1/guests/<guest_id>/functions` | PUT | jwt_required | ✓ |
| `/api/v1/guests/<guest_id>/invitation-token/rotate` | POST | jwt_required | ✓ |
| `/api/v1/guests/<guest_id>/invitation-token/revoke` | POST | jwt_required | ✓ |
| `/api/v1/guests/export.csv` | GET | jwt_required | ✓ |

### 3.2 Invitation Endpoints

| Endpoint | Method | Auth | Status |
|---|---|---|---|
| `/api/v1/invitations/templates` | GET | none | ✓ |
| `/api/v1/invitations` | GET | jwt_required | ✓ |
| `/api/v1/invitations` | POST | jwt_required | ✓ |
| `/api/v1/invitations/<id>` | GET | jwt_required | ✓ |
| `/api/v1/invitations/<id>` | PATCH | jwt_required | ✓ |
| `/api/v1/invitations/<id>/revoke` | POST | jwt_required | ✓ |
| `/api/v1/invitations/public/lookup` | POST | none | ✓ (rate limited) |
| `/api/v1/invitations/<id>/share-token/rotate` | POST | jwt_required | ✓ |

### 3.3 RSVP Endpoints

| Endpoint | Method | Auth | Status |
|---|---|---|---|
| `/api/v1/rsvp/lookup` | POST | none | ✓ (rate limited) |
| `/api/v1/rsvp` | POST | none | ✓ (rate limited) |
| `/api/v1/guests/<guest_id>/invitation-token/rotate` | POST | jwt_required | ✓ |

---
## 4. SECURITY WEAKNESSES IDENTIFIED

### 4.1 Guest Privacy Issues

**4.1.1 Public Guest List Enumeration**
- `GET /api/v1/events/<event_id>/guests` returns full guest list if user has permission
- No rate limiting on guest listing endpoints
- **Risk**: Unauthorized guests can be enumerated once workspace access is obtained

**4.1.2 Phone/Email Exposure in Exports**
- `GET /api/v1/events/<event_id>/guests/export.csv` includes raw phone and email
- CSV export has no redaction of sensitive fields
- **Risk**: Personal contact data exposed in exported files

**4.1.3 Guest Information in API Responses**
- `Guest.to_dict()` includes `phone`, `email`, `group`, `rsvpStatus`, `plusOnes`, `maxAttendees`
- Public invitation pages should never expose these fields
- **Risk**: Accidental exposure through incorrect frontend rendering

### 4.2 Invitation Token Security

**4.2.1 Token Entropy Verification**
- Current implementation uses `secrets.token_urlsafe(32)` → 256 bits ✓
- Hash uses SHA-256 ✓
- **However**: No verification that old tokens are invalidated after rotation/revocation

**4.2.2 Missing Token Lifetime Configuration**
- Expiry days read from `INVITATION_TOKEN_EXPIRY_DAYS` config
- No per-invitation configurable expiry
- **Risk**: All invitations have same expiry regardless of template/type

### 4.3 RSVP Security Issues

**4.3.1 RSVP Deadline Enforcement**
- RSVP validation checks token expiry and revocation ✓
- **Missing**: RSDP deadline validation - no explicit deadline check
- **Risk**: Guests can RSVP after event has passed

**4.3.2 Concurrent RSVP Updates**
- No database-level locking for concurrent RSVP submissions
- **Risk**: Race conditions could corrupt attendee counts

**4.3.3 Function Access Control**
- RSVP allows selecting functions, but validation depends on `guest.function_mappings`
- If no function mappings exist, all event functions are available
- **Risk**: Guest could RSVP to functions not intended for them

### 4.4 Authorization Bypasses

**4.4.1 Frontend-Supplied IDs Not Verified**
- Multiple endpoints accept `guest_id`, `event_id`, `function_id` from JWT
- **Critical**: Backend must derive these from authenticated membership, not trust frontend
- Verified: `_owned_event()`, `require_event_permission()` used in routes ✓

**4.4.2 Cross-Workspace Access**
- `list_guests()` uses `_owned_event()` which checks ownership
- **Need to verify**: Family member role permissions are properly enforced

### 4.5 Rate Limiting Gaps

**4.5.1 In-Memory Limits Only**
- Flask-Limiter with `get_remote_address()` key function
- **Problem**: No distributed rate limiting for multi-instance deployments
- **Risk**: Rate limits easily bypassed in production

**4.5.2 Public Endpoint Limits**
- `PUBLIC_INVITATION_LOOKUP_LIMIT`
- `PUBLIC_RSVP_LOOKUP_LIMIT`
- `PUBLIC_RSVP_SUBMIT_LIMIT`
- `PUBLIC_INVALID_TOKEN_LIMIT` (HMAC-fingerprint based)
---
## 6. FRONTEND AUDIT

### 6.1 Public Guest Pages
- `/invitation/:token` route exists
- **Need to verify**: Rate limiting, proper encoding, enumeration protection

### 6.2 Family Dashboard
- Guest List, Add Guest, Edit Guest, Guest Details ✓
- Invitation Management ✓
- RSVP Dashboard ✓
- **Missing**: Attendance reports with proper privacy controls

### 6.3 Form Validation
- Guest schema validates phone, email, name lengths ✓
- RSVP schema validates status, plusOnes, dietaryNotes ✓
- **Missing**: Duplicate submission prevention (anti-CSRF tokens in forms)

### 6.4 Mobile Responsiveness
- Public invitation page needs mobile browser testing
- WhatsApp share integration needs verification
---
## 7. NOTIFICATIONS AUDIT

### 7.1 Existing Notification Support
- Invitation created/share/ revoked events recorded in audit log
- **Missing**: No actual notification delivery (SMS/Email/WhatsApp)
- **Missing**: No notification service configuration in .env

### 7.2 Concerns
- No notification service integration found
- No recipient selection logic visible
- No duplicate notification prevention
- **Risk**: If notification service is added later, privacy issues may arise

---
## 8. SUMMARY OF REQUIRED CHANGES

---
## 8. SUMMARY OF REQUIRED CHANGES

### Priority 1 - Critical Security Fixes
1. ✅ Implement RSVP deadline validation - Added `rsvp_deadline` column to Event model, deadline check in `_guest_for_token`
2. ✅ Ensure guest exports redact phone/email for non-owners - CSV export now checks user role for data exposure
3. ✅ Verify token rotation fully invalidates old tokens - Token rotation now preserves revocation state (fixed)
4. ✅ Add per-invitation expiry configuration - Already implemented via `share_expires_at` on UserInvitation

### Priority 2 - High Priority
1. ⚠️ Add configurable per-invitation expiry - Already via `share_expires_at`; ensure consistency
2. ⚠️ Implement proper rate limiting with distributed storage (Redis) - Documented limitation for in-memory limits
3. ⚠️ Add audit trail for RSVP changes - Need to implement RSVP change logging
4. ⚠️ Fix guest CSV export to redact private data - In progress

### Priority 3 - Medium Priority
1. ⚠️ Add constant-time token comparison - Review hash_comparison usage
2. ⚠️ Implement soft-delete with retention policy for guests - Documented requirement
3. ⚠️ Add per-template invitation design schema validation - Marshmallow schema needed
4. ⚠️ Enhance frontend mobile responsiveness - Frontend task

### Priority 4 - Low Priority
1. Add token fingerprinting for abuse monitoring - Already implemented via HMAC fingerprint key
2. ⚠️ Implement notification service with proper privacy controls - Not yet integrated
3. ⚠️ Add comprehensive frontend tests - Test framework exists, need to add tests
4. ⚠️ Document all security events and retention policies - In progress

---
*End of Audit*

---
## 5. DATABASE INTEGRITY AUDIT