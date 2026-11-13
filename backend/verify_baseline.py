import sqlite3

con = sqlite3.connect('instance/utsav.db')
cur = con.cursor()

# Verify baseline revision 91d2e7a4c631 matches the database
# Expected tables after migration 91d2e7a4c631

# Table list from database
cur.execute("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name;")
db_tables = sorted([r[0] for r in cur.fetchall()])
print('Database tables:')
for t in db_tables:
    print('  ', t)

# Known tables from 91d2e7a4c631
expected_tables = [
    'audit_logs', 'bookings', 'booking_status_history', 'budget_categories',
    'catering_menus', 'commission_rules', 'event_functions', 'events', 'expenses',
    'family_members', 'family_membership_permissions', 'family_memberships',
    'family_workspace_invitation_permissions', 'family_workspace_invitations',
    'family_workspaces', 'guest_function_mappings', 'guest_groups', 'guests',
    'invitation_templates', 'invoices', 'notifications', 'organizations',
    'payments', 'platform_categories', 'quotation_line_items', 'quotations',
    'rsvps', 'transactions', 'user_invitations', 'users',
    'vendor_availability', 'vendor_booking_assignments', 'vendor_membership_permissions',
    'vendor_memberships', 'vendor_packages', 'vendor_portfolio', 'vendor_profiles',
    'vendor_services', 'vendor_staff_invitations', 'venue_availability', 'venues'
]

print()
print('Expected tables (after 91d2e7a4c631):')
for t in expected_tables:
    print('  ', t)

missing_from_db = set(expected_tables) - set(db_tables)
extra_in_db = set(db_tables) - set(expected_tables)

print()
print('Missing from database:', sorted(missing_from_db))
print('Extra in database:', sorted(extra_in_db))
print('Match:', len(missing_from_db) == 0 and len(extra_in_db) == 0)

con.close()
