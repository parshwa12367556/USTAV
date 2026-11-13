import sqlite3
import os
import hashlib

db_path = 'instance/utsav.db'
backup_path = 'instance/backups/utsav_pre_t002_20261113_083719.db'

print("=== PHASE A - PREFLIGHT EVIDENCE ===")
print()

# Original database stats
print('--- Original Database ---')
print(f'Path: {os.path.abspath(db_path)}')
print(f'File size: {os.path.getsize(db_path)} bytes')

con = sqlite3.connect(db_path)
cur = con.cursor()
cur.execute('PRAGMA integrity_check;')
print(f'Integrity: {cur.fetchone()[0]}')
cur.execute('PRAGMA foreign_key_check;')
violations = cur.fetchall()
print(f'Foreign key violations: {len(violations)}')
cur.execute('PRAGMA journal_mode;')
print(f'Journal mode: {cur.fetchone()[0]}')
cur.execute("SELECT COUNT(*) FROM sqlite_master WHERE type='table';")
print(f'Total tables: {cur.fetchone()[0]}')
cur.execute("SELECT version_num FROM alembic_version;")
print(f'alembic_version rows: {cur.fetchall()}')
con.close()

# File hash
with open(db_path, 'rb') as f:
    file_hash = hashlib.sha256(f.read()).hexdigest()
print(f'SHA-256: {file_hash}')
print()

# Backup verification
print('--- Backup Verification ---')
print(f'Backup path: {os.path.abspath(backup_path)}')
print(f'Backup exists: {os.path.exists(backup_path)}')
if os.path.exists(backup_path):
    print(f'Backup size: {os.path.getsize(backup_path)} bytes')
    con = sqlite3.connect(backup_path)
    cur = con.cursor()
    cur.execute('PRAGMA integrity_check;')
    print(f'Backup integrity: {cur.fetchone()[0]}')
    cur.execute("SELECT COUNT(*) FROM sqlite_master WHERE type='table';")
    print(f'Backup table count: {cur.fetchone()[0]}')
    con.close()
    with open(backup_path, 'rb') as f:
        backup_hash = hashlib.sha256(f.read()).hexdigest()
    print(f'Backup SHA-256: {backup_hash}')
    print(f'Hashes match: {file_hash == backup_hash}')
print()
print('=== PREFLIGHT COMPLETE ===')
