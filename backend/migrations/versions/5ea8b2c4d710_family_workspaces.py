"""add family workspaces and scoped memberships

Revision ID: 5ea8b2c4d710
Revises: 3c7d9e2f1a64
Create Date: 2026-11-06 16:50:00
"""
from uuid import uuid4

import sqlalchemy as sa
from alembic import op


revision = "5ea8b2c4d710"
down_revision = "3c7d9e2f1a64"
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        "family_workspaces",
        sa.Column("owner_user_id", sa.String(length=36), nullable=False),
        sa.Column("name", sa.String(length=160), nullable=False),
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["owner_user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("owner_user_id"),
    )
    op.create_table(
        "family_memberships",
        sa.Column("workspace_id", sa.String(length=36), nullable=False),
        sa.Column("user_id", sa.String(length=36), nullable=False),
        sa.Column("role", sa.String(length=20), nullable=False),
        sa.Column("status", sa.String(length=20), nullable=False),
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["workspace_id"], ["family_workspaces.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("workspace_id", "user_id", name="uq_family_membership_user"),
    )
    op.create_index(
        op.f("ix_family_memberships_workspace_id"),
        "family_memberships",
        ["workspace_id"],
        unique=False,
    )
    op.create_index(
        op.f("ix_family_memberships_user_id"),
        "family_memberships",
        ["user_id"],
        unique=False,
    )
    op.create_table(
        "family_membership_permissions",
        sa.Column("membership_id", sa.String(length=36), nullable=False),
        sa.Column("permission", sa.String(length=80), nullable=False),
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["membership_id"], ["family_memberships.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("membership_id", "permission", name="uq_family_membership_permission"),
    )
    op.create_index(
        op.f("ix_family_membership_permissions_membership_id"),
        "family_membership_permissions",
        ["membership_id"],
        unique=False,
    )
    op.create_table(
        "family_workspace_invitations",
        sa.Column("workspace_id", sa.String(length=36), nullable=False),
        sa.Column("email", sa.String(length=255), nullable=False),
        sa.Column("role", sa.String(length=20), nullable=False),
        sa.Column("token_hash", sa.String(length=64), nullable=False),
        sa.Column("status", sa.String(length=20), nullable=False),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("invited_by_user_id", sa.String(length=36), nullable=False),
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["workspace_id"], ["family_workspaces.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["invited_by_user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("token_hash"),
    )
    op.create_index(
        op.f("ix_family_workspace_invitations_workspace_id"),
        "family_workspace_invitations",
        ["workspace_id"],
        unique=False,
    )
    op.create_index(
        op.f("ix_family_workspace_invitations_email"),
        "family_workspace_invitations",
        ["email"],
        unique=False,
    )
    op.create_table(
        "family_workspace_invitation_permissions",
        sa.Column("invitation_id", sa.String(length=36), nullable=False),
        sa.Column("permission", sa.String(length=80), nullable=False),
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["invitation_id"], ["family_workspace_invitations.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("invitation_id", "permission", name="uq_family_workspace_invitation_permission"),
    )
    op.create_index(
        op.f("ix_family_workspace_invitation_permissions_invitation_id"),
        "family_workspace_invitation_permissions",
        ["invitation_id"],
        unique=False,
    )

    bind = op.get_bind()
    users = sa.table(
        "users",
        sa.column("id", sa.String()),
        sa.column("name", sa.String()),
        sa.column("role", sa.String()),
    )
    workspaces = sa.table(
        "family_workspaces",
        sa.column("id", sa.String()),
        sa.column("owner_user_id", sa.String()),
        sa.column("name", sa.String()),
        sa.column("created_at", sa.DateTime(timezone=True)),
        sa.column("updated_at", sa.DateTime(timezone=True)),
    )
    memberships = sa.table(
        "family_memberships",
        sa.column("id", sa.String()),
        sa.column("workspace_id", sa.String()),
        sa.column("user_id", sa.String()),
        sa.column("role", sa.String()),
        sa.column("status", sa.String()),
        sa.column("created_at", sa.DateTime(timezone=True)),
        sa.column("updated_at", sa.DateTime(timezone=True)),
    )
    now = sa.func.now()
    for user in bind.execute(sa.select(users.c.id, users.c.name).where(users.c.role == "family")):
        workspace_id = str(uuid4())
        bind.execute(
            workspaces.insert().values(
                id=workspace_id,
                owner_user_id=user.id,
                name=f"{user.name}'s Family",
                created_at=now,
                updated_at=now,
            )
        )
        bind.execute(
            memberships.insert().values(
                id=str(uuid4()),
                workspace_id=workspace_id,
                user_id=user.id,
                role="owner",
                status="active",
                created_at=now,
                updated_at=now,
            )
        )


def downgrade():
    op.drop_index(
        op.f("ix_family_workspace_invitation_permissions_invitation_id"),
        table_name="family_workspace_invitation_permissions",
    )
    op.drop_table("family_workspace_invitation_permissions")
    op.drop_index(
        op.f("ix_family_workspace_invitations_email"),
        table_name="family_workspace_invitations",
    )
    op.drop_index(
        op.f("ix_family_workspace_invitations_workspace_id"),
        table_name="family_workspace_invitations",
    )
    op.drop_table("family_workspace_invitations")
    op.drop_index(
        op.f("ix_family_membership_permissions_membership_id"),
        table_name="family_membership_permissions",
    )
    op.drop_table("family_membership_permissions")
    op.drop_index(op.f("ix_family_memberships_user_id"), table_name="family_memberships")
    op.drop_index(op.f("ix_family_memberships_workspace_id"), table_name="family_memberships")
    op.drop_table("family_memberships")
    op.drop_table("family_workspaces")
