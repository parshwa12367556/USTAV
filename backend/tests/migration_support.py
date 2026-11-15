"""Migration hosts with no application factory or automatic schema creation."""
from pathlib import Path

from flask import Flask
from flask_migrate import Migrate, upgrade
from flask_sqlalchemy import SQLAlchemy

MIGRATIONS = Path(__file__).resolve().parents[1] / "migrations"
LIVE = Path(__file__).resolve().parents[1] / "instance" / "utsav.db"


def migrate_database(path: Path, revision="head"):
    path = path.resolve()
    if path == LIVE.resolve() or (LIVE.exists() and path.exists() and path.samefile(LIVE)):
        raise RuntimeError("Refusing live database migration")
    if (LIVE.parent / "backups").resolve() in path.parents:
        raise RuntimeError("Refusing backup migration")
    app = Flask("isolated_migration_host")
    app.config["SQLALCHEMY_DATABASE_URI"] = "sqlite:///" + path.as_posix()
    database = SQLAlchemy(app)
    Migrate(app, database, directory=str(MIGRATIONS))
    with app.app_context():
        with database.engine.connect() as connection:
            actual = Path(connection.exec_driver_sql("PRAGMA database_list").fetchone()[2]).resolve()
            assert actual == path and actual != LIVE.resolve()
            # SQLite batch recreation needs this outside a transaction. Run
            # integrity/FK checks before returning the migrated database.
            assert connection.exec_driver_sql("PRAGMA foreign_keys").scalar() == 0
        try:
            upgrade(directory=str(MIGRATIONS), revision=revision)
            with database.engine.connect() as connection:
                assert connection.exec_driver_sql("PRAGMA integrity_check").fetchall() == [("ok",)]
                assert connection.exec_driver_sql("PRAGMA foreign_key_check").fetchall() == []
        finally:
            database.engine.dispose()
