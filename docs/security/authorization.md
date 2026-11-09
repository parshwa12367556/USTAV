# Authorization model

## Identity roles

The backend account roles include family, vendor, planner, and admin. Membership context further distinguishes family owner/member/planner, vendor owner/staff, and active workspace/business. A guest invitation link is a separate public bearer capability, not a logged-in role.

## Family workspace permissions

Family members and planners receive scoped permissions stored against a membership. Current permission names are defined in `backend/app/services/workspace_service.py`; examples include `event.view`, `event.update`, `guest.view`, `guest.create`, `guest.update`, `guest.delete`, `invitation.view`, `booking.view`, `payment.view`, and `budget.manage`.

Family owners have owner behavior. Non-owner actions must check the exact requested permission and active membership. Membership ID, user ID, workspace ID, and event owner must all agree.

## Vendor workspace permissions

Vendor owner and staff memberships are distinct. Staff permissions are checked in vendor-specific route logic, and booking assignments further constrain staff access. Vendor profile/price-management features are owner-only unless code explicitly grants otherwise.

## Route implementation expectations

- Authenticate protected endpoints with `@jwt_required()`.
- Scope event collections with `accessible_event_ids(user_id, permission, membership_id)`.
- Scope a specific event/guest/group/booking by loading it and calling `require_event_permission` or an equivalent domain authorization check.
- Never rely on a frontend role guard or possession of an object ID as authorization.
- For special roles such as planners, verify the assignment/membership is active and resource-scoped.
- Avoid returning credentials such as RSVP bearer tokens on ordinary read/list serializers. The guest RSVP token endpoint and rotation endpoint require `guest.update`.

## Denial behavior

Private resources commonly return 404 on unauthorized access to avoid confirming existence. Authenticated but forbidden non-resource operations may return 403. API clients must not interpret a hidden navigation item as sufficient authorization.

## Security review checklist for new routes

- What is the resource owner/tenant?
- Which membership claim is used, and can it be user-controlled?
- Is the exact permission enforced server-side for read and write?
- Are nested IDs checked to belong to the same parent resource?
- Are secret fields excluded from serializers, exports, logs, and errors?
- Are cross-tenant tests included for owners, members, planners, vendor users, and anonymous users?

## Scope note

This describes the intended/current patterns, not a guarantee every endpoint has been exhaustively audited. Re-run authorization tests when routes or membership rules change.