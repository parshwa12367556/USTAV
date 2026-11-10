# UTSAV Guest Data Privacy

## Purpose
This document describes the privacy protections for guest data in the UTSAV Indian Wedding and Event Management Platform.

## Data Classification

### Publicly Available Data
- Couple names
- Wedding title
- Wedding functions (names, dates, venues)
- Event dates and timings
- Invitation message
- RSVP option (attending/declined/maybe)
- Attendee count (total number)
- Approved venue information

### Restricted Data (Requires Authentication)
- Guest full names (visible only to workspace members)
- Phone numbers (never publicly exposed)
- Email addresses (never publicly exposed)
- Guest addresses
- Special requirements/notes
- Meal preferences
- RSVP status (per guest)
- Plus ones count
- Function-specific RSVPs

### Highly Restricted Data (Owner/Planner Only)
- Guest family/group associations
- Internal notes
- Vendor payment information
- Booking information
- Budget details
- Complete guest lists with contact details

## Privacy Protections

### 1. Guest Phone and Email Protection

#### Backend
- Phone and email stored in database but not in public API responses
- CSV export redacts phone/email for non-owners
- Family workspace owners see full data; non-owners have redaction

#### Frontend
- Public invitation page never displays phone or email
- Family dashboard shows contact details only to authorized users

### 2. Guest List Enumeration Prevention

#### API Protection
- `GET /api/v1/events/<event_id>/guests` requires valid JWT and permission
- Returns 404 for non-owned events
- Rate limiting on guest listing endpoints

#### Public Invitation Page
- `/invitation/:token` does not list all guests
- Only shows couple names, wedding details, and functions
- Rate limiting per IP + token fingerprinting

### 3. Private Guest Notes
- Stored in guest record but not exposed through any API
- Not visible in `Guest.to_dict()` output
- Not visible in public invitation page or RSVP confirmation
- Only accessible through admin routes with appropriate permissions

### 4. Guest Export Controls

#### CSV Export
- `GET /api/v1/events/<event_id>/guests/export.csv`
- Family owners see complete data (name, group, email, phone, RSVP)
- Non-owners see redacted data (name, group, RSVP only; email/phone blank)
- Audit event logged: `guest.exported` with `is_owner` metadata

#### Export Permissions
- Only workspace members can export
- Export role depends on membership role
- `FAMILY_OWNER` → full data export
- `FAMILY_MEMBER` → redacted data export
- `WEDDING_PLANNER` → redacted data export (unless assigned)

### 5. Audit Logging (Privacy-Sensitive)

#### Logged Events (Anonymized)
- `guest.created` - no raw phone/email, just name and role
- `guest.updated` - tracks changed fields, redacts contact data
- `guest.deleted` - tracks deletion, retains anonymized count
- `guest.exported` - logs export event with `is_owner` flag, no raw data
- `invitation.generated` - logs token hash (not raw token)
- `invitation.revoked` - logs revocation event
- `guest.rsvp_submitted` - logs RSVP, no guest contact details
- `guest.rsvp_updated` - logs RSVP update

#### Not Logged (Privacy)
- Raw invitation tokens
- Passwords
- OTPs
- Complete private guest records
- Authentication secrets

### 6. Data Retention Policy

#### Guest Records
- Retained for duration of workspace + 1 year after closure
- Anonymization option: name replaced with "Guest" after 1 year
- RSVP history retained even if invitation revoked

#### Invitation Records
- Retained for duration of associated event + 1 year
- Share token hashes retained for audit trail
- Raw tokens never stored permanently

#### Audit Logs
- Retained for 90 days minimum
- Purged periodically based on config

## Indian Data Protection Considerations

### Applicable Requirements (Pending Legal Review)
- **Digital Personal Data Protection Act, 2023 (DPDP Act)**
- **Information Technology (Reasonable Security Practices and Procedures and Sensitive Personal Data or Information) Rules, 2011 (IT Rules)**

### Data Principal Rights (Under DPDP Act Draft)
- Right to informed consent
- Right to seek correction and erasure
- Right to grievance redressal
- Right to nominees

### Consent Recording (If Collected)
- **Consent purpose**: Stored (e.g., "wedding_invitation")
- **Consent version**: Stored for tracking changes
- **Timestamp**: When consent was given
- **Relevant guest association**: Guest ID linked to consent record

### Legal Assessment Required
- Qualified legal review needed for full DPDP Act compliance
- Consent mechanism design (opt-in vs opt-out)
- Data retention period determination
- Breach notification procedure

### Recommendations
1. Implement consent recording framework if not already present
2. Ensure all data collection has clear purpose documentation
3. Provide data subject access/request mechanisms
4. Document retention and deletion procedures
5. Conduct DPDP Act compliance assessment with legal counsel
6. Implement data breach notification procedure
7. Ensure privacy by design in all new features

## Security Events Documentation

| Event | Data Logged | Privacy Level |
|---|---|---|
| `guest.created` | name, role, workspace_id | Low - no contact data |
| `guest.updated` | changed_fields, resource_id | Low - redacts contact |
| `guest.deleted` | count, resource_id | Low - anonymized |
| `guest.exported` | is_owner, count, resource_id | Low - aggregated |
| `invitation.generated` | share_token_hash, resource_id | Medium - hash only |
| `invitation.revoked` | resource_id | Low - no contact |
| `guest.rsvp_submitted` | event_id, function_count | Low - aggregated |
| `guest.rsvp_updated` | event_id, function_count | Low - aggregated |