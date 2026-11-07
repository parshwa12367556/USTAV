"""add vendor date availability

Revision ID: 3c7d9e2f1a64
Revises: 8dbb21927fb9
Create Date: 2026-11-06 16:40:00

"""
from alembic import op
import sqlalchemy as sa


revision = "3c7d9e2f1a64"
down_revision = "8dbb21927fb9"
branch_labels = None
depends_on = None


def upgrade():
    with op.batch_alter_table("vendor_packages") as batch_op:
        batch_op.add_column(
            sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.true())
        )
        batch_op.alter_column("is_active", server_default=None)

    op.create_table(
        "vendor_availability",
        sa.Column("vendor_id", sa.String(length=36), nullable=False),
        sa.Column("date", sa.Date(), nullable=False),
        sa.Column("is_available", sa.Boolean(), nullable=False),
        sa.Column("note", sa.String(length=255), nullable=True),
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["vendor_id"], ["vendor_profiles.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("vendor_id", "date", name="uq_vendor_availability_date"),
    )
    op.create_index(
        op.f("ix_vendor_availability_vendor_id"),
        "vendor_availability",
        ["vendor_id"],
        unique=False,
    )


def downgrade():
    op.drop_index(op.f("ix_vendor_availability_vendor_id"), table_name="vendor_availability")
    op.drop_table("vendor_availability")
    with op.batch_alter_table("vendor_packages") as batch_op:
        batch_op.drop_column("is_active")
