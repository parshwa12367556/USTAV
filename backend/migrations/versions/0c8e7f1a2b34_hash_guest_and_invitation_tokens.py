"""hash guest and digital invitation bearer tokens

Revision ID: 0c8e7f1a2b34
Revises: c8d4a9f1e270
Create Date: 2026-03-19
"""

from secrets import token_urlsafe
from hashlib import sha256

import sqlalchemy as sa
from alembic import op


revision = "0c8e7f1a2b34"
down_revision = "c8d4a9f1e270"
branch_labels = None
depends_on = None


def _digest(value: str) -> str:
    return sha256(value.encode("utf-8")).hexdigest()


def upgrade():
    connection = op.get_bind()
    if connection.dialect.name == "sqlite":
        connection.exec_driver_sql("PRAGMA secure_delete=ON")

    with op.batch_alter_table("guests") as batch_op:
        batch_op.add_column(sa.Column("invitation_token_hash", sa.String(length=64), nullable=True))
        batch_op.add_column(sa.Column("invitation_revoked_at", sa.DateTime(timezone=True), nullable=True))
        batch_op.add_column(sa.Column("max_attendees", sa.Integer(), nullable=True))
        batch_op.alter_column("invitation_token", existing_type=sa.String(length=48), nullable=True)

    guests = sa.table(
        "guests",
        sa.column("id", sa.String(length=36)),
        sa.column("invitation_token", sa.String(length=48)),
        sa.column("invitation_token_hash", sa.String(length=64)),
    )
    for guest_id, old_token in connection.execute(
        sa.select(guests.c.id, guests.c.invitation_token)
    ):
        connection.execute(
            guests.update()
            .where(guests.c.id == guest_id)
            .values(invitation_token_hash=_digest(old_token or token_urlsafe(32)))
        )

    connection.execute(sa.text("UPDATE guests SET max_attendees = 21 WHERE max_attendees IS NULL"))
    with op.batch_alter_table("guests") as batch_op:
        batch_op.alter_column("invitation_token_hash", existing_type=sa.String(length=64), nullable=False)
        batch_op.alter_column("max_attendees", existing_type=sa.Integer(), nullable=False)
        batch_op.drop_column("invitation_token")
    op.create_index("uq_guests_invitation_token_hash", "guests", ["invitation_token_hash"], unique=True)

    with op.batch_alter_table("user_invitations") as batch_op:
        batch_op.add_column(sa.Column("share_token_hash", sa.String(length=64), nullable=True))

    invitations = sa.table(
        "user_invitations",
        sa.column("id", sa.String(length=36)),
        sa.column("share_token", sa.String(length=48)),
        sa.column("share_token_hash", sa.String(length=64)),
    )
    for invitation_id, old_token in connection.execute(
        sa.select(invitations.c.id, invitations.c.share_token)
    ):
        if old_token:
            connection.execute(
                invitations.update()
                .where(invitations.c.id == invitation_id)
                .values(share_token_hash=_digest(old_token))
            )

    with op.batch_alter_table("user_invitations") as batch_op:
        batch_op.drop_column("share_token")
    op.create_index(
        "uq_user_invitations_share_token_hash",
        "user_invitations",
        ["share_token_hash"],
        unique=True,
    )


def downgrade():
    connection = op.get_bind()
    with op.batch_alter_table("user_invitations") as batch_op:
        batch_op.add_column(sa.Column("share_token", sa.String(length=48), nullable=True))

    invitations = sa.table(
        "user_invitations",
        sa.column("id", sa.String(length=36)),
        sa.column("share_token_hash", sa.String(length=64)),
        sa.column("share_token", sa.String(length=48)),
    )
    for invitation_id, token_hash in connection.execute(
        sa.select(invitations.c.id, invitations.c.share_token_hash)
    ):
        if token_hash:
            connection.execute(
                invitations.update()
                .where(invitations.c.id == invitation_id)
                .values(share_token=token_urlsafe(32))
            )

    op.drop_index("uq_user_invitations_share_token_hash", table_name="user_invitations")
    with op.batch_alter_table("user_invitations") as batch_op:
        batch_op.drop_column("share_token_hash")

    with op.batch_alter_table("guests") as batch_op:
        batch_op.add_column(sa.Column("invitation_token", sa.String(length=48), nullable=True))
        batch_op.drop_column("max_attendees")

    guests = sa.table(
        "guests",
        sa.column("id", sa.String(length=36)),
        sa.column("invitation_token", sa.String(length=48)),
    )
    for (guest_id,) in connection.execute(sa.select(guests.c.id)):
        connection.execute(
            guests.update()
            .where(guests.c.id == guest_id)
            .values(invitation_token=token_urlsafe(32))
        )

    op.drop_index("uq_guests_invitation_token_hash", table_name="guests")
    with op.batch_alter_table("guests") as batch_op:
        batch_op.drop_column("invitation_token_hash")
        batch_op.drop_column("invitation_revoked_at")
        batch_op.alter_column("invitation_token", existing_type=sa.String(length=48), nullable=False)
        batch_op.create_unique_constraint("uq_guests_invitation_token", ["invitation_token"])
    with op.batch_alter_table("user_invitations") as batch_op:
        batch_op.create_unique_constraint("uq_user_invitations_share_token", ["share_token"])
