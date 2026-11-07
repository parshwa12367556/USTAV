"""expire and rotate guest invitation tokens

Revision ID: 71cd20f4a8b3
Revises: 5ea8b2c4d710
Create Date: 2026-11-06 17:05:00
"""
from datetime import datetime, timedelta, timezone

import sqlalchemy as sa
from alembic import op


revision = "71cd20f4a8b3"
down_revision = "5ea8b2c4d710"
branch_labels = None
depends_on = None


def upgrade():
    with op.batch_alter_table("guests") as batch_op:
        batch_op.add_column(sa.Column("invitation_expires_at", sa.DateTime(timezone=True), nullable=True))
    with op.batch_alter_table("user_invitations") as batch_op:
        batch_op.add_column(sa.Column("share_expires_at", sa.DateTime(timezone=True), nullable=True))

    expiration = datetime.now(timezone.utc) + timedelta(days=90)
    guests = sa.table(
        "guests",
        sa.column("invitation_expires_at", sa.DateTime(timezone=True)),
    )
    op.get_bind().execute(guests.update().values(invitation_expires_at=expiration))
    invitations = sa.table(
        "user_invitations",
        sa.column("status", sa.String()),
        sa.column("share_expires_at", sa.DateTime(timezone=True)),
    )
    op.get_bind().execute(
        invitations.update()
        .where(invitations.c.status == "published")
        .values(share_expires_at=expiration)
    )

    with op.batch_alter_table("guests") as batch_op:
        batch_op.alter_column("invitation_expires_at", nullable=False)


def downgrade():
    with op.batch_alter_table("user_invitations") as batch_op:
        batch_op.drop_column("share_expires_at")
    with op.batch_alter_table("guests") as batch_op:
        batch_op.drop_column("invitation_expires_at")
