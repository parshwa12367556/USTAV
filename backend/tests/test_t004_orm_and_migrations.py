from datetime import date, datetime, timedelta, timezone
from decimal import Decimal
from pathlib import Path
from secrets import token_urlsafe
from flask_jwt_extended import create_access_token

import pytest
import sqlalchemy as sa
from alembic.autogenerate import compare_metadata
from alembic.migration import MigrationContext
from alembic.operations import Operations
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import configure_mappers

from app import create_app
from app.extensions import db
from app.models.event import Event
from app.models.booking import Booking
from app.models.rsvp import RSVP
from app.models.file_asset import FileAsset
from app.models.guest import Guest
from app.models.invitation import UserInvitation
from app.models.payment import Payment, Transaction
from app.models.quotation import QuotationLineItem, QuotationRequest
from app.models.user import User
from migration_support import LIVE, migrate_database


def test_all_mappers_and_reciprocals():
    configure_mappers()
    mappers = list(db.Model.registry.mappers)
    assert len(mappers) == 47
    for mapper in mappers:
        for relationship in mapper.relationships:
            if relationship.back_populates:
                reciprocal = relationship.mapper.relationships[relationship.back_populates]
                assert reciprocal.mapper is mapper
                assert reciprocal.back_populates == relationship.key


def test_migrated_schema_matches_metadata_including_defaults(app):
    with db.engine.connect() as connection:
        assert connection.exec_driver_sql("SELECT version_num FROM alembic_version").scalar() == "e5c0a3b7f912"
        assert compare_metadata(MigrationContext.configure(connection, opts={
            "compare_type": True, "compare_server_default": True,
        }), db.metadata) == []


def test_live_and_backup_targets_rejected_before_startup():
    for target in (LIVE, LIVE.parent / "backups" / "utsav_pre_t002_20261113_083719.db"):
        with pytest.raises(RuntimeError, match="Unsafe test database"):
            create_app("testing", {"SQLALCHEMY_DATABASE_URI": "sqlite:///" + target.as_posix()})
        with pytest.raises(RuntimeError, match="Refusing"):
            migrate_database(target)


def test_empty_test_startup_does_not_create_or_stamp(tmp_path):
    target = tmp_path / "empty.db"
    app = create_app("testing", {"SQLALCHEMY_DATABASE_URI": "sqlite:///" + target.as_posix(), "UPLOAD_FOLDER": str(tmp_path / "uploads")})
    with app.app_context():
        assert sa.inspect(db.engine).get_table_names() == []
        db.engine.dispose()


def test_sqlite_rsvp_deadline_handles_naive_utc(app, family_user):
    event = Event(owner_id=family_user["id"], name="Deadline", event_type="Wedding",
                  date=date(2027, 1, 1), rsvp_deadline=datetime.now(timezone.utc) - timedelta(seconds=1))
    db.session.add(event); db.session.commit(); db.session.expire_all()
    assert db.session.get(Event, event.id).rsvp_deadline_passed is True


def test_batch_migration_rejects_unsafe_pragma_before_any_ddl(tmp_path):
    import runpy
    target = tmp_path / "guard.db"
    migrate_database(target, "d4b9f2a6e801")
    migration = runpy.run_path(str(Path(__file__).resolve().parents[1] / "migrations/versions/e5c0a3b7f912_reconcile_application_schema.py"))
    engine = sa.create_engine("sqlite:///" + target.as_posix())
    try:
        with engine.connect() as connection:
            connection.exec_driver_sql("PRAGMA foreign_keys=ON")
            before = {t: sa.inspect(connection).get_columns(t) for t in ("events", "payments", "quotations", "transactions")}
            with Operations.context(MigrationContext.configure(connection)):
                with pytest.raises(RuntimeError, match="foreign_keys=OFF"):
                    migration["upgrade"]()
            after = {t: sa.inspect(connection).get_columns(t) for t in before}
            assert {t: [c["name"] for c in cols] for t, cols in before.items()} == {t: [c["name"] for c in cols] for t, cols in after.items()}
            assert connection.exec_driver_sql("SELECT version_num FROM alembic_version").scalar() == "d4b9f2a6e801"
    finally:
        engine.dispose()


@pytest.mark.parametrize("load_collection", [False, True])
def test_file_asset_orm_restricts_uploader_deletion(app, family_user, load_collection):
    uploader = db.session.get(User, family_user["id"])
    deleter = User(name="Test deleter", email="deleter@example.invalid", password_hash="unusable")
    asset = FileAsset(original_filename="test.txt", storage_filename="unique.txt", storage_key="unique-key",
                      file_extension="txt", resource_type="test", uploader=uploader, deleter=deleter)
    db.session.add(asset)
    db.session.commit()
    asset_id, deleter_id = asset.id, deleter.id
    db.session.expire_all()
    asset = db.session.get(FileAsset, asset_id)
    assert asset.uploader.id == uploader.id
    assert asset.user is asset.uploader
    assert asset.deleter.id == deleter_id
    if load_collection:
        assert asset in uploader.uploaded_files
    db.session.delete(uploader)
    with pytest.raises(IntegrityError):
        db.session.commit()
    db.session.rollback()
    assert db.session.get(FileAsset, asset_id).uploaded_by == family_user["id"]
    deleter = db.session.get(User, deleter_id)
    assert asset in deleter.deleted_files
    db.session.delete(deleter)
    db.session.commit()
    db.session.expire_all()
    assert db.session.get(FileAsset, asset_id).deleted_by is None


def test_quotation_items_reciprocal_and_orphan_removal(app, family_user):
    # The FK points to quotations, not a separate Quotation entity.
    from app.models.vendor import VendorProfile
    user = db.session.get(User, family_user["id"])
    event = Event(owner=user, name="Quote", event_type="Wedding", date=date(2027, 1, 1))
    vendor = VendorProfile(user=user, business_name="Vendor", category="Venue", city="Test")
    db.session.add_all([event, vendor]); db.session.flush()
    quotation = QuotationRequest(event_id=event.id, vendor_id=vendor.id, title="Quote")
    item = QuotationLineItem(description="Service", quantity=2, unit_price=Decimal("12.50"))
    quotation.items.append(item)
    db.session.add(quotation); db.session.commit()
    item_id = item.id
    assert item.quotation is quotation
    quotation.items.remove(item); db.session.commit()
    assert db.session.get(QuotationLineItem, item_id) is None


def test_legacy_tokens_and_populated_forward_migrations(tmp_path):
    target = tmp_path / "legacy.db"
    migrate_database(target, "91d2e7a4c631")
    engine = sa.create_engine("sqlite:///" + target.as_posix())
    metadata = sa.MetaData(); metadata.reflect(bind=engine)
    now = datetime.now(timezone.utc)
    active, expired, share, expired_share = [token_urlsafe(32) for _ in range(4)]
    with engine.begin() as connection:
        connection.exec_driver_sql("PRAGMA foreign_keys=ON")
        def insert(table, identifier, **values):
            connection.execute(metadata.tables[table].insert().values(
                id=identifier, created_at=now, updated_at=now, **values))
        insert("users", "owner", name="Legacy Owner", email="legacy@example.invalid", password_hash="unusable", role="family", is_active=True, is_verified=True)
        insert("family_workspaces", "workspace", owner_user_id="owner", name="Legacy family")
        insert("family_memberships", "owner-membership", workspace_id="workspace", user_id="owner", role="owner", status="active")
        insert("events", "event", owner_id="owner", name="Legacy Event", event_type="Wedding", date=date(2027, 1, 1), guest_count=0, status="planning", venue="Preserved venue", location="Preserved location")
        insert("event_functions", "function", event_id="event", name="Preserved function", date=date(2027, 1, 1), venue="Function venue", guest_count=0)
        for identifier, token, expiration in (("active", active, now + timedelta(days=2)), ("expired", expired, now - timedelta(days=1))):
            insert("guests", identifier, event_id="event", name=identifier, rsvp_status="pending", plus_ones=0, invitation_token=token, invitation_expires_at=expiration)
        insert("rsvps", "legacy-rsvp", guest_id="expired", function_id="function", status="maybe", plus_ones=0, dietary_notes="Synthetic retained note")
        insert("invitation_templates", "template", name="Test", category="Wedding", price=0, is_published=True)
        for identifier, token, expiration in (("share", share, now + timedelta(days=2)), ("expired-share", expired_share, now - timedelta(days=1))):
            insert("user_invitations", identifier, event_id="event", template_id="template", title="Legacy invitation", status="published", design={}, share_token=token, share_expires_at=expiration)
        insert("vendor_profiles", "vendor", user_id="owner", business_name="Test Vendor", category="Venue", city="Test", rating=0, review_count=0, verification_status="verified")
        insert("quotations", "quotation", event_id="event", vendor_id="vendor", title="Legacy quote", status="draft")
        insert("quotation_line_items", "item", quotation_id="quotation", description="Retained item", quantity=2, unit_price=Decimal("12.50"))
        insert("bookings", "booking", event_id="event", vendor_id="vendor", service_name="Preserved booking", event_date=date(2027, 1, 1), amount=25, status="confirmed")
        insert("payments", "payment", booking_id="booking", invoice_number="legacy-invoice", amount=25, currency="INR", status="paid")
        insert("transactions", "transaction", payment_id="payment", provider="test", status="paid", response_data={})
    engine.dispose()
    migrate_database(target)
    app = create_app("testing", {"SQLALCHEMY_DATABASE_URI": "sqlite:///" + target.as_posix(), "UPLOAD_FOLDER": str(tmp_path / "uploads"), "RATELIMIT_ENABLED": False})
    try:
        with app.app_context():
            client = app.test_client()
            assert client.get("/api/v1/health").status_code == 200
            assert client.post("/api/v1/rsvp/lookup", json={"token": active}).status_code == 200
            assert client.post("/api/v1/rsvp/lookup", json={"token": expired}).status_code == 410
            assert client.post("/api/v1/invitations/public/lookup", json={"token": share}).status_code == 200
            assert client.post("/api/v1/invitations/public/lookup", json={"token": expired_share}).status_code == 410
            assert client.post("/api/v1/rsvp", json={"invitationToken": active, "status": "attending", "plusOnes": 1}).status_code == 200
            guest = db.session.get(Guest, "active")
            assert guest.max_attendees == 21 and guest.invitation_expires_at.replace(tzinfo=timezone.utc) > now
            guest.max_attendees = 2
            db.session.commit()
            assert client.post("/api/v1/rsvp", json={"invitationToken": active, "status": "attending", "plusOnes": 2}).status_code == 400
            guest.invitation_revoked_at = now
            invitation = db.session.get(UserInvitation, "share"); invitation.share_token_hash = None
            db.session.commit()
            assert client.post("/api/v1/rsvp/lookup", json={"token": active}).status_code == 410
            assert client.post("/api/v1/invitations/public/lookup", json={"token": share}).status_code == 404
            assert client.post("/api/v1/rsvp/lookup", json={"token": token_urlsafe(32)}).status_code == 404
            owner_access = create_access_token("owner", additional_claims={"role": "family", "membership_id": "owner-membership"})
            owner_headers = {"Authorization": "Bearer " + owner_access}
            rotated = client.post("/api/v1/guests/active/invitation-token/rotate", headers=owner_headers)
            assert rotated.status_code == 200
            assert client.post("/api/v1/rsvp/lookup", json={"token": active}).status_code == 404
            assert client.post("/api/v1/rsvp/lookup", json={"token": rotated.json["invitationToken"]}).status_code == 410
            reissued = client.post("/api/v1/guests/active/invitation-token/reissue", headers=owner_headers)
            assert reissued.status_code == 200
            assert client.post("/api/v1/rsvp/lookup", json={"token": rotated.json["invitationToken"]}).status_code == 404
            assert client.post("/api/v1/rsvp/lookup", json={"token": reissued.json["invitationToken"]}).status_code == 200
            event = db.session.get(Event, "event")
            assert (event.venue, event.location) == ("Preserved venue", "Preserved location")
            assert event.functions[0].id == "function" and event.functions[0].venue == "Function venue"
            previous_rsvp = db.session.get(RSVP, "legacy-rsvp")
            assert previous_rsvp.status == "maybe" and previous_rsvp.dietary_notes == "Synthetic retained note"
            assert db.session.get(Booking, "booking").status == "confirmed"
            quote = db.session.get(QuotationRequest, "quotation")
            assert quote.total_amount == Decimal("25.00") and quote.revision == 1
            assert len(quote.items) == 1 and quote.items[0].id == "item"
            payment = db.session.get(Payment, "payment")
            assert payment.refund_amount == 0 and payment.refund_status == "pending" and payment.booking_id == "booking"
            transaction = db.session.get(Transaction, "transaction")
            assert transaction.provider_event_id is None and transaction.status == "paid"
            transaction.provider_event_id = "same-event"; db.session.commit()
            db.session.add(Transaction(payment_id="payment", provider="test", provider_event_id="same-event", status="paid"))
            with pytest.raises(IntegrityError): db.session.commit()
            db.session.rollback()
            db.session.add_all([
                Transaction(payment_id="payment", provider="other", provider_event_id="same-event", status="paid"),
                Transaction(payment_id="payment", provider="test", status="paid"),
                Transaction(payment_id="payment", provider="test", status="paid"),
            ])
            db.session.commit()
            with db.engine.connect() as connection:
                assert connection.exec_driver_sql("PRAGMA integrity_check").scalar() == "ok"
                assert connection.exec_driver_sql("PRAGMA foreign_key_check").fetchall() == []
                assert "invitation_token" not in {c["name"] for c in sa.inspect(connection).get_columns("guests")}
                assert "share_token" not in {c["name"] for c in sa.inspect(connection).get_columns("user_invitations")}
    finally:
        with app.app_context():
            db.session.remove(); db.engine.dispose()
