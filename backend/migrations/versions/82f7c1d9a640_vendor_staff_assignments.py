"""add vendor staff memberships and booking assignments

Revision ID: 82f7c1d9a640
Revises: 71cd20f4a8b3
Create Date: 2026-11-06 17:20:00
"""
from alembic import op
import sqlalchemy as sa


revision = "82f7c1d9a640"
down_revision = "71cd20f4a8b3"
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        "vendor_memberships",
        sa.Column("vendor_id", sa.String(length=36), nullable=False),
        sa.Column("user_id", sa.String(length=36), nullable=False),
        sa.Column("role", sa.String(length=20), nullable=False),
        sa.Column("status", sa.String(length=20), nullable=False),
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["vendor_id"], ["vendor_profiles.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("vendor_id", "user_id", name="uq_vendor_membership_user"),
    )
    op.create_index(op.f("ix_vendor_memberships_vendor_id"), "vendor_memberships", ["vendor_id"], unique=False)
    op.create_index(op.f("ix_vendor_memberships_user_id"), "vendor_memberships", ["user_id"], unique=False)
    op.create_table(
        "vendor_membership_permissions",
        sa.Column("membership_id", sa.String(length=36), nullable=False),
        sa.Column("permission", sa.String(length=80), nullable=False),
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["membership_id"], ["vendor_memberships.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("membership_id", "permission", name="uq_vendor_membership_permission"),
    )
    op.create_index(
        op.f("ix_vendor_membership_permissions_membership_id"),
        "vendor_membership_permissions",
        ["membership_id"],
        unique=False,
    )
    op.create_table(
        "vendor_staff_invitations",
        sa.Column("vendor_id", sa.String(length=36), nullable=False),
        sa.Column("email", sa.String(length=255), nullable=False),
        sa.Column("token_hash", sa.String(length=64), nullable=False),
        sa.Column("status", sa.String(length=20), nullable=False),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("invited_by_user_id", sa.String(length=36), nullable=False),
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["vendor_id"], ["vendor_profiles.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["invited_by_user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("token_hash"),
    )
    op.create_index(
        op.f("ix_vendor_staff_invitations_vendor_id"),
        "vendor_staff_invitations",
        ["vendor_id"],
        unique=False,
    )
    op.create_index(
        op.f("ix_vendor_staff_invitations_email"),
        "vendor_staff_invitations",
        ["email"],
        unique=False,
    )
    op.create_table(
        "vendor_booking_assignments",
        sa.Column("booking_id", sa.String(length=36), nullable=False),
        sa.Column("membership_id", sa.String(length=36), nullable=False),
        sa.Column("assigned_by_user_id", sa.String(length=36), nullable=False),
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["assigned_by_user_id"], ["users.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["booking_id"], ["bookings.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["membership_id"], ["vendor_memberships.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("booking_id", "membership_id", name="uq_vendor_booking_assignment"),
    )
    op.create_index(
        op.f("ix_vendor_booking_assignments_booking_id"),
        "vendor_booking_assignments",
        ["booking_id"],
        unique=False,
    )
    op.create_index(
        op.f("ix_vendor_booking_assignments_membership_id"),
        "vendor_booking_assignments",
        ["membership_id"],
        unique=False,
    )


def downgrade():
    op.drop_index(op.f("ix_vendor_booking_assignments_membership_id"), table_name="vendor_booking_assignments")
    op.drop_index(op.f("ix_vendor_booking_assignments_booking_id"), table_name="vendor_booking_assignments")
    op.drop_table("vendor_booking_assignments")
    op.drop_index(op.f("ix_vendor_staff_invitations_email"), table_name="vendor_staff_invitations")
    op.drop_index(op.f("ix_vendor_staff_invitations_vendor_id"), table_name="vendor_staff_invitations")
    op.drop_table("vendor_staff_invitations")
    op.drop_index(op.f("ix_vendor_membership_permissions_membership_id"), table_name="vendor_membership_permissions")
    op.drop_table("vendor_membership_permissions")
    op.drop_index(op.f("ix_vendor_memberships_user_id"), table_name="vendor_memberships")
    op.drop_index(op.f("ix_vendor_memberships_vendor_id"), table_name="vendor_memberships")
    op.drop_table("vendor_memberships")
