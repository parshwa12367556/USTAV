"""persist revoked JWT identifiers

Revision ID: 2a9c5e1f7b40
Revises: 91d2e7a4c631
Create Date: 2026-11-08 06:57:00
"""
import sqlalchemy as sa
from alembic import op


revision = "2a9c5e1f7b40"
down_revision = "91d2e7a4c631"
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        "revoked_tokens",
        sa.Column("jti", sa.String(length=36), nullable=False),
        sa.Column("user_id", sa.String(length=36), nullable=False),
        sa.Column("expires_at", sa.Integer(), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("jti"),
    )
    op.create_index(op.f("ix_revoked_tokens_expires_at"), "revoked_tokens", ["expires_at"])
    op.create_index(op.f("ix_revoked_tokens_user_id"), "revoked_tokens", ["user_id"])


def downgrade():
    op.drop_index(op.f("ix_revoked_tokens_user_id"), table_name="revoked_tokens")
    op.drop_index(op.f("ix_revoked_tokens_expires_at"), table_name="revoked_tokens")
    op.drop_table("revoked_tokens")
