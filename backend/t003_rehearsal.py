"""Read-only source preflight and strict baseline gate. Never targets the live DB for writes."""
from pathlib import Path
from datetime import datetime, timezone
import contextlib
import hashlib
import io
import json
import sqlite3
import sys
import tempfile

from alembic.config import Config
from alembic.script import ScriptDirectory
from dotenv import load_dotenv
from flask import Flask
from flask_migrate import Migrate, upgrade
from flask_sqlalchemy import SQLAlchemy
from sqlalchemy import create_engine, inspect

ROOT = Path(__file__).resolve().parent
SOURCE = ROOT / "instance/utsav.db"
BACKUP = ROOT / "instance/backups/utsav_pre_t002_20261113_083719.db"
BASELINE = "91d2e7a4c631"


def readonly(path):
    return sqlite3.connect(path.resolve().as_uri() + "?mode=ro", uri=True)


def evidence(path):
    before = path.stat()
    with contextlib.closing(readonly(path)) as connection:
        result = {
            "path": str(path.resolve()), "size": before.st_size,
            "mtime_ns": before.st_mtime_ns,
            "sha256": hashlib.sha256(path.read_bytes()).hexdigest(),
            "tables": [r[0] for r in connection.execute("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name")],
            "versions": connection.execute("SELECT version_num FROM alembic_version").fetchall(),
            "integrity": connection.execute("PRAGMA integrity_check").fetchall(),
            "foreign_key_violation_count": len(connection.execute("PRAGMA foreign_key_check").fetchall()),
            "journal_mode": connection.execute("PRAGMA journal_mode").fetchone()[0],
        }
    result["sidecars"] = {suffix: {"size": p.stat().st_size, "sha256": hashlib.sha256(p.read_bytes()).hexdigest()} for suffix in ("-wal", "-shm", "-journal") if (p := Path(str(path) + suffix)).exists()}
    return result


def schema(path):
    # Reflection uses SQLite's read-only URI, including all application tables.
    engine = create_engine("sqlite:///file:" + path.as_posix() + "?mode=ro&uri=true")
    inspector = inspect(engine)
    result = {}
    for table in sorted(inspector.get_table_names()):
        if table == "alembic_version":
            continue
        columns = [{**c, "type": str(c["type"])} for c in inspector.get_columns(table)]
        def ordered(items):
            return sorted(items, key=lambda item: json.dumps(item, sort_keys=True, default=str))
        result[table] = {
            "columns": sorted(columns, key=lambda c: c["name"]),
            "primary_key": inspector.get_pk_constraint(table),
            "foreign_keys": ordered(inspector.get_foreign_keys(table)),
            "unique_constraints": ordered(inspector.get_unique_constraints(table)),
            "indexes": ordered(inspector.get_indexes(table)),
            "check_constraints": ordered(inspector.get_check_constraints(table)),
        }
    engine.dispose()
    return result


def main():
    target_dir = Path(tempfile.mkdtemp(prefix="utsav_t003_", dir=ROOT / "instance"))
    report = {"recorded_utc": datetime.now(timezone.utc).isoformat(), "directory": str(target_dir)}
    try:
        report["source_before"] = evidence(SOURCE)
        report["backup_before"] = evidence(BACKUP)
        for key in ("source_before", "backup_before"):
            assert report[key]["integrity"] == [("ok",)], key + " integrity failed"
        load_dotenv(ROOT / ".env")
        from app.config import get_config
        report["configured_database_uri"] = get_config().SQLALCHEMY_DATABASE_URI
        cfg = Config(str(ROOT / "migrations/alembic.ini"))
        cfg.set_main_option("script_location", str(ROOT / "migrations"))
        graph = ScriptDirectory.from_config(cfg)
        report["heads"] = graph.get_heads()
        report["graph"] = [{"revision": r.revision, "parent": r.down_revision} for r in graph.walk_revisions()]
        assert report["heads"] in (["0c8e7f1a2b34"], ["d4b9f2a6e801"]), "Unexpected HEAD"
        target = target_dir / "rehearsal.db"
        assert target.resolve() not in (SOURCE.resolve(), BACKUP.resolve())
        with contextlib.closing(readonly(SOURCE)) as source, contextlib.closing(sqlite3.connect(target)) as destination:
            source.backup(destination)
        report["copy"] = evidence(target)
        assert schema(target) == schema(SOURCE), "Copy schema differs"
        assert report["copy"]["integrity"] == [("ok",)]
        assert report["copy"]["foreign_key_violation_count"] == 0
        print("Disposable migration target:", target, flush=True)
        reference = target_dir / "baseline_reference.db"
        # Minimal Flask migration host bypasses create_app's implicit create_all/stamp.
        app = Flask("t003_baseline_reference")
        app.config.update(SQLALCHEMY_DATABASE_URI="sqlite:///" + reference.as_posix(), SQLALCHEMY_TRACK_MODIFICATIONS=False)
        database = SQLAlchemy(app)
        Migrate(app, database, directory=str(ROOT / "migrations"))
        output = io.StringIO()
        print("Reference-only migration target:", reference, flush=True)
        with app.app_context(), contextlib.redirect_stdout(output), contextlib.redirect_stderr(output):
            with database.engine.connect() as connection:
                actual = Path(connection.exec_driver_sql("PRAGMA database_list").fetchone()[2]).resolve()
                assert actual == reference.resolve() and actual != SOURCE.resolve()
            upgrade(directory=str(ROOT / "migrations"), revision=BASELINE)
            database.engine.dispose()
        (target_dir / "baseline-build.log").write_text(output.getvalue(), encoding="utf-8")
        expected, actual = schema(reference), schema(target)
        differences = []
        for table in sorted(set(expected) | set(actual)):
            if table not in expected or table not in actual:
                differences.append({"table": table, "kind": "unexpected_table" if table not in expected else "missing_table"})
                continue
            for field in expected[table]:
                if expected[table][field] != actual[table][field]:
                    differences.append({"table": table, "kind": field, "expected": expected[table][field], "actual": actual[table][field]})
        comparison = {"baseline": BASELINE, "expected": expected, "actual": actual, "differences": differences, "pass": not differences}
        (target_dir / "schema-comparison.json").write_text(json.dumps(comparison, indent=2, default=str), encoding="utf-8")
        report["baseline_comparison"] = {"pass": not differences, "differences": len(differences), "tables_with_differences": sorted({d["table"] for d in differences})}
        report["status"] = "STOPPED_BASELINE_MISMATCH" if differences else "BASELINE_MATCH_REQUIRES_NEXT_PHASE"
        # Deliberately no stamp/upgrade of the rehearsal copy until this gate passes.
    except Exception as error:
        report["status"] = "STOPPED_ERROR"
        report["error"] = f"{type(error).__name__}: {error}"
        raise
    finally:
        report["source_after"] = evidence(SOURCE)
        report["backup_after"] = evidence(BACKUP)
        report["source_unchanged"] = report.get("source_before") == report["source_after"]
        report["backup_unchanged"] = report.get("backup_before") == report["backup_after"]
        (target_dir / "preflight.json").write_text(json.dumps(report, indent=2, default=str), encoding="utf-8")
        print(json.dumps({k: v for k, v in report.items() if k not in ("source_before", "source_after", "backup_before", "backup_after", "graph")}, indent=2, default=str))


if __name__ == "__main__":
    main()
