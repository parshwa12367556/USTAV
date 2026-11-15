"""Reconcile additive application fields without removing historical event data.

Revision ID: e5c0a3b7f912
Revises: d4b9f2a6e801
"""
from alembic import op
import sqlalchemy as sa

revision = "e5c0a3b7f912"
down_revision = "d4b9f2a6e801"
branch_labels = None
depends_on = None


def upgrade():
    bind = op.get_bind()
    if bind.dialect.name == "sqlite" and bind.exec_driver_sql("PRAGMA foreign_keys").scalar():
        raise RuntimeError(
            "SQLite batch reconciliation requires a verified migration host with foreign_keys=OFF "
            "before the transaction; run integrity_check and foreign_key_check before reconnecting the application."
        )
    op.add_column("events", sa.Column("rsvp_deadline", sa.DateTime(timezone=True), nullable=True))
    op.create_index("ix_events_rsvp_deadline", "events", ["rsvp_deadline"])
    for column in (
        sa.Column("refund_amount", sa.Numeric(12, 2), nullable=False, server_default="0"),
        sa.Column("refund_status", sa.String(20), nullable=False, server_default="pending"),
        sa.Column("refund_provider_reference", sa.String(120), nullable=True),
        sa.Column("refund_initiated_by", sa.String(36), nullable=True),
        sa.Column("refund_timestamp", sa.DateTime(timezone=True), nullable=True),
    ):
        op.add_column("payments", column)
    with op.batch_alter_table("quotations") as batch:
        batch.add_column(sa.Column("revision", sa.Integer(), nullable=False, server_default="1"))
        batch.add_column(sa.Column("previous_quotation_id", sa.String(36), nullable=True))
        batch.add_column(sa.Column("revised_by", sa.String(36), nullable=True))
        batch.add_column(sa.Column("revised_at", sa.DateTime(timezone=True), nullable=True))
        batch.add_column(sa.Column("requires_fresh_approval", sa.Boolean(), nullable=False, server_default=sa.false()))
        batch.add_column(sa.Column("items_snapshot", sa.JSON(), nullable=False, server_default="{}"))
        batch.add_column(sa.Column("total_amount", sa.Numeric(12, 2), nullable=False, server_default="0"))
        batch.create_foreign_key("fk_quotation_previous", "quotations", ["previous_quotation_id"], ["id"])
    # Historical line items remain the source of truth; preserve their total.
    op.execute(sa.text("UPDATE quotations SET total_amount = COALESCE((SELECT SUM(quantity * unit_price) FROM quotation_line_items WHERE quotation_id = quotations.id), 0)"))
    op.add_column("transactions", sa.Column("provider_event_id", sa.String(120), nullable=True))
    with op.batch_alter_table("transactions") as batch:
        batch.create_unique_constraint("uq_provider_event_id", ["provider", "provider_event_id"])
        batch.create_index("ix_transactions_provider_event_id", ["provider_event_id"])


def downgrade():
    raise RuntimeError("Forward-only reconciliation: restore a verified backup and matching code instead of dropping application data.")
