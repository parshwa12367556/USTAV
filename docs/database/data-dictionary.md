# Data dictionary

This is a conceptual inventory of SQLAlchemy model tables in `backend/app/models`. All `BaseModel` subclasses also have `id`, `created_at`, and `updated_at` unless stated otherwise. Exact nullability, types, indexes, defaults, and foreign-key actions are defined by models and migrations.

| Table | Purpose and principal data |
|---|---|
| `users` | Name, email, phone, password hash, account role/active/verified state, OTP/reset hashes and attempts, security version, encrypted TOTP value, MFA flag, recovery-code hashes. |
| `user_sessions` | User, refresh-token hash/current JTI, device/browser/OS/IP/user-agent metadata, activity/expiry/revocation. |
| `revoked_tokens` | JWT JTI, user, expiration time; primary key is JTI. |
| `security_events` | User, event type/result, resource, IP/user agent, metadata JSON. |
| `family_workspaces` | Owner user and workspace name. |
| `family_memberships` | Workspace/user link, role, active/revoked status. |
| `family_membership_permissions` | Membership permission strings. |
| `family_workspace_invitations` | Workspace, invited email, role, token hash, status, expiry, inviter. |
| `family_workspace_invitation_permissions` | Permission set carried by an invitation. |
| `planner_profiles` | Planner account, company name, experience. |
| `planner_assignments` | Planner, workspace, membership, assigner, status. |
| `events` | Owner, title/type, event dates, venue/location, guest count, budget, status, description. |
| `event_functions` | Event schedule entries with name/date/venue/guest count/notes. |
| `guests` | Event/group, name/email/phone, RSVP status/plus-ones, raw RSVP bearer token, token expiry. |
| `guest_groups` | Event-scoped named groups. |
| `guest_function_mappings` | Guest-to-function invitation assignment. |
| `rsvps` | Guest/function RSVP status, plus-ones, optional dietary notes. |
| `budget_categories` | Event category, allocation, color. |
| `expenses` | Category, description, amount, date, paid flag. |
| `vendor_profiles` | Owner user, business name/category/city/address, rating/count, starting price, description, verification status. |
| `vendor_services` | Vendor service name, description, price, active state. |
| `vendor_packages` | Vendor packages, pricing, inclusions, active state. |
| `catering_menus` | Vendor menu name, per-plate price, description, active state. |
| `vendor_portfolio` | Vendor image URL and caption. |
| `vendor_availability` | Vendor date availability. |
| `vendor_memberships` | Vendor/user, owner or staff role, status. |
| `vendor_membership_permissions` | Staff permission strings. |
| `vendor_staff_invitations` | Vendor, invited email, token hash, status, expiry, inviter. |
| `vendor_booking_assignments` | Booking/staff membership assignment and assigner. |
| `venues` | Optional vendor, name/city/capacity/price/amenities/image/active state. |
| `venue_availability` | Venue/date availability. |
| `bookings` | Event/vendor, service, date, amount, status; assigned staff relation. |
| `booking_status_history` | Booking status and optional note. |
| `quotations` | Event/vendor, title/status/validity. |
| `quotation_line_items` | Quotation item description/quantity/unit price. |
| `payments` | Optional booking, invoice number, amount/currency/status/paid time. |
| `transactions` | Payment, provider/reference/status, provider response JSON. |
| `invoices` | Payment and optional PDF path. |
| `invitation_templates` | Name/category/preview URL/price/published status. |
| `user_invitations` | Event/template/title/status/design JSON/share token/expiry. |
| `platform_categories` | Marketplace category state and metadata. |
| `commission_rules` | Effective-dated provider/category commission configuration. |
| `audit_logs` | Optional actor, action, target, details JSON. |
| `notifications` | User, title, message, read state. |
| `organizations` | Organization name and owner. |
| `family_members` | Legacy/additional family member records; see model before relying on relationship semantics. |

## Personal and sensitive data

Identity and contact details, guest contact details, event locations, dietary notes, transaction/provider metadata, IP/device data, and bearer invitation tokens may be present. Apply least privilege, retention, privacy notice, encryption, and backup controls. Guest RSVP bearer tokens are currently raw in the guest row and must be handled as secrets.

## Exclusions and caveats

This list excludes migration bookkeeping and any provider-managed database metadata. It describes current model declarations, not the contents of any specific database or whether every table is used by active UI flows. Inspect `backend/app/models` and current Alembic revision before making schema or compliance decisions.