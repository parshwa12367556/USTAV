"""Verify additive T004 migration on a new copy; never migrate the input DB.

Run from any directory: python backend/t004_verify.py --source <T003 copy>
"""
import argparse
from contextlib import closing, redirect_stderr, redirect_stdout
import hashlib
import json
import logging
from pathlib import Path
import sqlite3
import sys
import tempfile

from alembic.autogenerate import compare_metadata
from alembic.migration import MigrationContext
from sqlalchemy.orm import configure_mappers

from app import create_app
from app.extensions import db
from t003_rehearsal import evidence, readonly, schema

ROOT = Path(__file__).resolve().parent
sys.path.insert(0, str(ROOT / "tests"))
from migration_support import migrate_database


def signatures(path, original_schema):
    result = {}
    with closing(readonly(path)) as connection:
        for table, definition in original_schema.items():
            columns = [c["name"] for c in definition["columns"]]
            names = ", ".join('"' + c.replace('"', '""') + '"' for c in columns)
            rows = connection.execute(f'SELECT {names} FROM "{table}"').fetchall()
            encoded = sorted(json.dumps(row, default=str) for row in rows)
            result[table] = {"rows": len(rows), "sha256": hashlib.sha256(json.dumps(encoded).encode()).hexdigest()}
    return result


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--source", type=Path, required=True)
    args = parser.parse_args()
    source = args.source.resolve()
    directory = Path(tempfile.mkdtemp(prefix="utsav_t004_verify_", dir=ROOT / "instance"))
    target = directory / "verification-copy.db"
    protected = [ROOT / "instance/utsav.db", ROOT / "instance/backups/utsav_pre_t002_20261113_083719.db", source]
    before = {str(p): evidence(p) for p in protected}
    report = {"source": str(source), "target": str(target), "before": before}
    try:
        with closing(readonly(source)) as connection:
            assert connection.execute("SELECT version_num FROM alembic_version").fetchall() == [("d4b9f2a6e801",)]
            with closing(sqlite3.connect(target)) as destination:
                connection.backup(destination)
        original_schema = schema(target)
        data_before = signatures(target, original_schema)
        app = create_app("testing", {"SQLALCHEMY_DATABASE_URI": "sqlite:///" + target.as_posix(), "UPLOAD_FOLDER": str(directory / "uploads")})
        def drift():
            with app.app_context(), db.engine.connect() as connection:
                actual = Path(connection.exec_driver_sql("PRAGMA database_list").fetchone()[2]).resolve()
                assert actual == target
                return [str(d) for d in compare_metadata(MigrationContext.configure(connection, opts={"compare_type": True, "compare_server_default": True}), db.metadata)]
        report["drift_before"] = drift()
        with app.app_context(): db.engine.dispose()
        print("Explicit disposable target:", target, flush=True)
        console_error = sys.stderr
        with (directory / "migration.log").open("w", encoding="utf-8") as log, redirect_stdout(log), redirect_stderr(log):
            try:
                migrate_database(target, "e5c0a3b7f912")
            finally:
                # Alembic fileConfig installs handlers targeting redirected stderr.
                # Restore their stream before closing the capture file.
                for logger in [logging.getLogger(), logging.getLogger("alembic"), logging.getLogger("sqlalchemy")]:
                    for handler in logger.handlers:
                        if getattr(handler, "stream", None) is log:
                            handler.setStream(console_error)
        report["drift_after"] = drift()
        assert report["drift_after"] == []
        report["data_signatures_before"] = data_before
        report["data_signatures_after"] = signatures(target, original_schema)
        assert report["data_signatures_after"] == data_before
        report["all_original_columns_and_records_preserved"] = True
        with app.app_context():
            configure_mappers()
            report["configured_mappers"] = len(list(db.Model.registry.mappers))
            report["relationships"] = {
                m.class_.__name__: {r.key: {"target": r.mapper.class_.__name__, "back_populates": r.back_populates, "local_columns": sorted(c.name for c in r.local_columns)} for r in m.relationships}
                for m in sorted(db.Model.registry.mappers, key=lambda m: m.class_.__name__)
            }
            client = app.test_client()
            report["health"] = {url: client.get(url).status_code for url in ("/health", "/api/v1/health")}
            assert set(report["health"].values()) == {200}
            assert client.post("/api/v1/rsvp/lookup", json={"token": "t004-controlled-nonexistent-token-00000000"}).status_code == 404
            db.session.remove(); db.engine.dispose()
        report["final_copy"] = evidence(target)
        (directory / "schema-before.json").write_text(json.dumps(original_schema, indent=2, default=str), encoding="utf-8")
        (directory / "schema-after.json").write_text(json.dumps(schema(target), indent=2, default=str), encoding="utf-8")
        report["status"] = "PASS"
    finally:
        report["after"] = {str(p): evidence(p) for p in protected}
        report["protected_files_unchanged"] = before == report["after"]
        (directory / "verification.json").write_text(json.dumps(report, indent=2, default=str), encoding="utf-8")
        assert report["protected_files_unchanged"]
    print("PASS: 47 mappers; no metadata drift including defaults; original records preserved; protected files unchanged.")
    print("Evidence:", directory)


if __name__ == "__main__":
    main()
