"""T005 copy-only rehearsal. There is deliberately no live-target option."""
from contextlib import closing, redirect_stderr, redirect_stdout
from datetime import datetime, timezone
from decimal import Decimal
import csv
import hashlib
import io
import json
import logging
import os
from pathlib import Path
import sqlite3
import subprocess
import sys
import tempfile
import traceback

from alembic.autogenerate import compare_metadata
from alembic.config import Config
from alembic.migration import MigrationContext
from alembic.script import ScriptDirectory
from flask import Flask
from flask_migrate import Migrate, stamp, upgrade
from flask_sqlalchemy import SQLAlchemy
from sqlalchemy import event
from sqlalchemy.orm import configure_mappers

from app import create_app
from app.extensions import db
import app.models
from t003_rehearsal import evidence, readonly, schema

ROOT = Path(__file__).resolve().parent
REPO = ROOT.parent
SOURCE = ROOT / "instance/utsav.db"
BACKUP = ROOT / "instance/backups/utsav_pre_t002_20261113_083719.db"
BASELINE = "91d2e7a4c631"
FINAL = "e5c0a3b7f912"
MIGRATIONS = ROOT / "migrations"


def dump(path, value):
    path.write_text(json.dumps(value, indent=2, default=str), encoding="utf-8")


def copy_database(source, destination):
    if destination.exists():
        raise RuntimeError("Refusing to overwrite an existing database")
    with closing(readonly(source)) as source_connection, closing(sqlite3.connect(destination)) as destination_connection:
        source_connection.backup(destination_connection)


def signatures(path, definition):
    result = {}
    with closing(readonly(path)) as connection:
        for table, details in definition.items():
            # Only these two reviewed plaintext columns disappear. Their
            # transformations are checked separately, without logging values.
            excluded = {"invitation_token"} if table == "guests" else {"share_token"} if table == "user_invitations" else set()
            columns = [c["name"] for c in details["columns"] if c["name"] not in excluded]
            projection = ",".join('"' + c.replace('"', '""') + '"' for c in columns)
            rows = connection.execute(f'SELECT {projection} FROM "{table}"').fetchall()
            encoded = sorted(json.dumps(row, default=str) for row in rows)
            result[table] = {"rows": len(rows), "compared_columns": columns, "sha256": hashlib.sha256(json.dumps(encoded).encode()).hexdigest()}
    return result


def private_directory():
    directory = Path(tempfile.mkdtemp(prefix="utsav_t005_", dir=ROOT / "instance"))
    if os.name == "nt":
        identity = next(csv.reader(io.StringIO(subprocess.check_output(["whoami", "/user", "/fo", "csv", "/nh"], text=True).strip())))
        subprocess.run(["icacls", str(directory), "/inheritance:r", "/grant:r", f"*{identity[1]}:(OI)(CI)F", "*S-1-5-18:(OI)(CI)F", "*S-1-5-32-544:(OI)(CI)F"], check=True, capture_output=True, text=True)
        acl = subprocess.check_output(["icacls", str(directory)], text=True)
        (directory / "directory-acl.txt").write_text(acl, encoding="utf-8")
    else:
        directory.chmod(0o700)
    return directory


def main():
    directory = private_directory()
    print("Private evidence directory:", directory, flush=True)
    target = directory / "rehearsal.db"
    report = {"recorded_utc": datetime.now(timezone.utc).isoformat(), "directory": str(directory), "target": str(target), "connections": []}
    protected = {"source": SOURCE, "existing_backup": BACKUP}
    report["before"] = {key: evidence(path) for key, path in protected.items()}
    dump(directory / "safety-before.json", report["before"])

    def maintenance(path, revision, baseline_stamp=False):
        path = path.resolve()
        if path.parent != directory.resolve() or any(path == p.resolve() or (path.exists() and path.samefile(p)) for p in protected.values()):
            raise RuntimeError("Unsafe migration target")
        print("Verified disposable maintenance target:", path, flush=True)
        host = Flask("t005_maintenance")
        host.config["SQLALCHEMY_DATABASE_URI"] = "sqlite:///" + path.as_posix()
        database = SQLAlchemy(host)
        Migrate(host, database, directory=str(MIGRATIONS))
        with host.app_context():
            @event.listens_for(database.engine, "connect")
            def verify_connection(connection, _record):
                actual = Path(connection.execute("PRAGMA database_list").fetchone()[2]).resolve()
                if actual != path or actual.parent != directory.resolve():
                    raise RuntimeError("Unverified migration connection")
                connection.execute("PRAGMA foreign_keys=OFF")
                if connection.execute("PRAGMA foreign_keys").fetchone()[0] != 0:
                    raise RuntimeError("SQLite maintenance pragma not applied before transaction")
                report["connections"].append({"target": str(actual), "foreign_keys_before_transaction": 0})
                print("Connection verified:", actual, "foreign_keys=OFF", flush=True)
            try:
                with database.engine.connect() as connection:
                    assert connection.exec_driver_sql("PRAGMA integrity_check").fetchall() == [("ok",)]
                    assert connection.exec_driver_sql("PRAGMA foreign_key_check").fetchall() == []
                    if baseline_stamp:
                        assert connection.exec_driver_sql("SELECT version_num FROM alembic_version").fetchall() == []
                if baseline_stamp:
                    stamp(directory=str(MIGRATIONS), revision=BASELINE)
                    with database.engine.connect() as connection:
                        assert connection.exec_driver_sql("SELECT version_num FROM alembic_version").fetchall() == [(BASELINE,)]
                    report["baseline_stamp_verified"] = True
                upgrade(directory=str(MIGRATIONS), revision=revision)
                with database.engine.connect() as connection:
                    assert connection.exec_driver_sql("SELECT version_num FROM alembic_version").fetchall() == [(revision,)]
                    connection.exec_driver_sql("PRAGMA foreign_keys=ON")
                    assert connection.exec_driver_sql("PRAGMA foreign_keys").scalar() == 1
                    assert connection.exec_driver_sql("PRAGMA integrity_check").fetchall() == [("ok",)]
                    assert connection.exec_driver_sql("PRAGMA foreign_key_check").fetchall() == []
                print("Final revision verified:", revision, "integrity=ok; FK violations=0; enforcement restored", flush=True)
            finally:
                database.engine.dispose()

    def capture(name, operation):
        original_stderr = sys.stderr
        with (directory / name).open("w", encoding="utf-8") as log, redirect_stdout(log), redirect_stderr(log):
            try:
                return operation()
            finally:
                for logger in (logging.getLogger(), logging.getLogger("alembic"), logging.getLogger("sqlalchemy")):
                    for handler in logger.handlers:
                        if getattr(handler, "stream", None) is log:
                            handler.setStream(original_stderr)

    try:
        for item in report["before"].values():
            assert item["integrity"] == [("ok",)] and item["foreign_key_violation_count"] == 0
        assert report["before"]["source"]["versions"] == []
        config = Config(str(MIGRATIONS / "alembic.ini")); config.set_main_option("script_location", str(MIGRATIONS))
        graph = ScriptDirectory.from_config(config)
        assert graph.get_heads() == [FINAL]
        required = {"0c8e7f1a2b34": "c8d4a9f1e270", "d4b9f2a6e801": "0c8e7f1a2b34", FINAL: "d4b9f2a6e801", "c8d4a9f1e270": ("a43c91dbe827", "4f2c8a9d1e63")}
        for revision, parent in required.items(): assert graph.get_revision(revision).down_revision == parent
        report["graph"] = [{"revision": r.revision, "parent": r.down_revision} for r in graph.walk_revisions()]
        configure_mappers(); report["mappers"] = len(list(db.Model.registry.mappers)); assert report["mappers"] == 47
        report["git_commit"] = subprocess.check_output(["git", "rev-parse", "HEAD"], cwd=REPO, text=True).strip()
        (directory / "working-tree.txt").write_text(subprocess.check_output(["git", "status", "--short"], cwd=REPO, text=True), encoding="utf-8")
        report["source_manifest"] = {str(p.relative_to(REPO)): hashlib.sha256(p.read_bytes()).hexdigest() for base in (ROOT / "app", ROOT / "migrations", ROOT / "tests") for p in sorted(base.rglob("*.py")) if "__pycache__" not in p.parts}
        original_schema = schema(SOURCE)
        dump(directory / "source-schema.json", original_schema)
        copy_database(SOURCE, target)
        assert schema(target) == original_schema
        report["fresh_copy"] = evidence(target)
        assert report["fresh_copy"]["integrity"] == [("ok",)] and report["fresh_copy"]["foreign_key_violation_count"] == 0
        before_signatures = signatures(target, original_schema)
        dump(directory / "data-before.json", before_signatures)
        reference = directory / "baseline-reference.db"
        capture("baseline-build.log", lambda: maintenance(reference, BASELINE))
        expected_schema = schema(reference)
        comparison = {"baseline": BASELINE, "expected": expected_schema, "actual": original_schema, "pass": expected_schema == original_schema}
        dump(directory / "baseline-comparison.json", comparison)
        assert comparison["pass"], "Baseline schema mismatch: no stamp allowed"
        report["baseline_comparison"] = "PASS; all application tables/columns/types/defaults/constraints/indexes"
        fresh_backup = directory / "fresh-pre-migration-backup.db"
        copy_database(target, fresh_backup)
        report["fresh_backup"] = evidence(fresh_backup)
        restore_stage = directory / "baseline-restore-stage.db"
        copy_database(fresh_backup, restore_stage)
        assert schema(restore_stage) == original_schema and signatures(restore_stage, original_schema) == before_signatures
        assert evidence(restore_stage)["integrity"] == [("ok",)] and evidence(restore_stage)["foreign_key_violation_count"] == 0
        report["baseline_restore_stage_verified"] = True
        print("Full-chain target before stamp/upgrade:", target, flush=True)
        capture("full-migration.log", lambda: maintenance(target, FINAL, baseline_stamp=True))
        after_signatures = signatures(target, original_schema)
        dump(directory / "data-after.json", after_signatures)
        assert before_signatures == after_signatures, "Existing column/row preservation failure"
        report["all_existing_business_rows_and_retained_columns_preserved"] = True
        with closing(readonly(fresh_backup)) as old, closing(readonly(target)) as current:
            transforms = {}
            for table, old_name, new_name in (("guests", "invitation_token", "invitation_token_hash"), ("user_invitations", "share_token", "share_token_hash")):
                count = 0
                for identifier, token in old.execute(f'SELECT id, "{old_name}" FROM "{table}"'):
                    value = current.execute(f'SELECT "{new_name}" FROM "{table}" WHERE id=?', (identifier,)).fetchone()[0]
                    if token: assert value == hashlib.sha256(token.encode()).hexdigest()
                    elif table == "guests": assert value is not None and len(value) == 64
                    else: assert value is None
                    count += 1
                transforms[table] = {"rows_verified": count, "plaintext_column_absent": old_name not in {r[1] for r in current.execute(f'PRAGMA table_info("{table}")')}}
                assert transforms[table]["plaintext_column_absent"]
            totals = 0
            for identifier, total in current.execute("SELECT id,total_amount FROM quotations"):
                expected = old.execute("SELECT COALESCE(SUM(quantity * unit_price),0) FROM quotation_line_items WHERE quotation_id=?", (identifier,)).fetchone()[0]
                assert Decimal(str(total)).quantize(Decimal(".01")) == Decimal(str(expected)).quantize(Decimal(".01"))
                totals += 1
            report["token_transformations"] = transforms
            report["quotation_totals_verified"] = totals
            assert current.execute("SELECT COUNT(*) FROM guests WHERE max_attendees != 21 OR max_attendees IS NULL").fetchone()[0] == 0
        application = create_app("testing", {"SQLALCHEMY_DATABASE_URI": "sqlite:///" + target.as_posix(), "UPLOAD_FOLDER": str(directory / "uploads"), "RATELIMIT_ENABLED": False})
        with application.app_context():
            with db.engine.connect() as connection:
                assert Path(connection.exec_driver_sql("PRAGMA database_list").fetchone()[2]).resolve() == target
                assert connection.exec_driver_sql("PRAGMA foreign_keys").scalar() == 1
                diffs = compare_metadata(MigrationContext.configure(connection, opts={"compare_type": True, "compare_server_default": True}), db.metadata)
                report["unrestricted_schema_differences"] = [str(d) for d in diffs]
                assert diffs == []
            client = application.test_client()
            report["health"] = {url: client.get(url).status_code for url in ("/health", "/api/v1/health")}
            assert set(report["health"].values()) == {200}
            db.session.remove(); db.engine.dispose()
        dump(directory / "final-schema.json", schema(target))
        # Independently stage a restore of the migrated database as well.
        final_stage = directory / "final-restore-stage.db"
        copy_database(target, final_stage)
        assert schema(final_stage) == schema(target)
        final_definition = schema(target)
        assert signatures(final_stage, final_definition) == signatures(target, final_definition)
        assert evidence(final_stage)["integrity"] == [("ok",)] and evidence(final_stage)["foreign_key_violation_count"] == 0
        report["final_restore_stage_verified"] = True
        report["final_copy"] = evidence(target)
        with closing(readonly(target)) as connection:
            report["final_table_row_counts"] = {table: connection.execute(f'SELECT COUNT(*) FROM "{table}"').fetchone()[0] for table in schema(target)}
        report["status"] = "MIGRATION_AND_DATA_REHEARSAL_PASS"
    except BaseException as error:
        report["status"] = "STOPPED_ERROR"
        report["error_type"] = type(error).__name__
        (directory / "failure-traceback.log").write_text(traceback.format_exc(), encoding="utf-8")
        raise
    finally:
        report["after"] = {key: evidence(path) for key, path in protected.items()}
        report["protected_files_unchanged"] = report["before"] == report["after"]
        dump(directory / "safety-after.json", report["after"])
        dump(directory / "rehearsal.json", report)
        assert report["protected_files_unchanged"], "Protected source/backup changed: STOP"
    print("PASS: full chain, complete schema, data signatures, recovery staging and original/backup safety.")
    print("Evidence:", directory)


if __name__ == "__main__":
    main()
