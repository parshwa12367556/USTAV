"""add admin categories and commission rules

Revision ID: 91d2e7a4c631
Revises: 82f7c1d9a640
Create Date: 2026-11-06 17:36:00
"""
from uuid import uuid4

import sqlalchemy as sa
from alembic import op


revision = "91d2e7a4c631"
down_revision = "82f7c1d9a640"
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        "platform_categories",
        sa.Column("name", sa.String(length=100), nullable=False),
        sa.Column("is_active", sa.Boolean(), nullable=False),
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("name"),
    )
    op.create_index(
        op.f("ix_platform_categories_is_active"),
        "platform_categories",
        ["is_active"],
        unique=False,
    )
    op.create_table(
        "commission_rules",
        sa.Column("category_name", sa.String(length=100), nullable=False),
        sa.Column("rate_percent", sa.Numeric(5, 2), nullable=False),
        sa.Column("effective_from", sa.Date(), nullable=False),
        sa.Column("created_by_user_id", sa.String(length=36), nullable=True),
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["created_by_user_id"], ["users.id"], ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint(
            "category_name",
            "effective_from",
            name="uq_commission_rule_category_effective",
        ),
    )
    op.create_index(
        op.f("ix_commission_rules_category_name"),
        "commission_rules",
        ["category_name"],
        unique=False,
    )
    op.create_index(
        op.f("ix_commission_rules_effective_from"),
        "commission_rules",
        ["effective_from"],
        unique=False,
    )

    bind = op.get_bind()
    existing_categories = bind.execute(
        sa.text("SELECT DISTINCT category FROM vendor_profiles WHERE category IS NOT NULL")
    )
    categories = sa.table(
        "platform_categories",
        sa.column("id", sa.String()),
        sa.column("name", sa.String()),
        sa.column("is_active", sa.Boolean()),
        sa.column("created_at", sa.DateTime(timezone=True)),
        sa.column("updated_at", sa.DateTime(timezone=True)),
    )
    for (name,) in existing_categories:
        clean_name = name.strip()
        if clean_name:
            bind.execute(
                categories.insert().values(
                    id=str(uuid4()),
                    name=clean_name,
                    is_active=True,
                    created_at=sa.func.now(),
                    updated_at=sa.func.now(),
                )
            )


def downgrade():
    op.drop_index(op.f("ix_commission_rules_effective_from"), table_name="commission_rules")
    op.drop_index(op.f("ix_commission_rules_category_name"), table_name="commission_rules")
    op.drop_table("commission_rules")
    op.drop_index(op.f("ix_platform_categories_is_active"), table_name="platform_categories")
    op.drop_table("platform_categories")
