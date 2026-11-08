"""add planner workspaces and vendor address

Revision ID: 4f2c8a9d1e63
Revises: 2a9c5e1f7b40
Create Date: 2026-11-08 07:10:00
"""
import sqlalchemy as sa
from alembic import op


revision = "4f2c8a9d1e63"
down_revision = "2a9c5e1f7b40"
branch_labels = None
depends_on = None


def upgrade():
    op.add_column("vendor_profiles", sa.Column("address", sa.String(length=500), nullable=True))
    op.create_table(
        "planner_profiles",
        sa.Column("user_id", sa.String(length=36), nullable=False),
        sa.Column("company_name", sa.String(length=180), nullable=True),
        sa.Column("years_experience", sa.Integer(), nullable=True),
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("user_id"),
    )
    op.create_table(
        "planner_assignments",
        sa.Column("planner_user_id", sa.String(length=36), nullable=False),
        sa.Column("workspace_id", sa.String(length=36), nullable=False),
        sa.Column("membership_id", sa.String(length=36), nullable=False),
        sa.Column("assigned_by_user_id", sa.String(length=36), nullable=False),
        sa.Column("status", sa.String(length=20), nullable=False),
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["assigned_by_user_id"], ["users.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["membership_id"], ["family_memberships.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["planner_user_id"], ["planner_profiles.user_id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["workspace_id"], ["family_workspaces.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("membership_id", name="uq_planner_assignment_membership"),
    )
    op.create_index("ix_planner_assignments_planner_user_id", "planner_assignments", ["planner_user_id"])
    op.create_index("ix_planner_assignments_workspace_id", "planner_assignments", ["workspace_id"])


def downgrade():
    op.drop_index("ix_planner_assignments_workspace_id", table_name="planner_assignments")
    op.drop_index("ix_planner_assignments_planner_user_id", table_name="planner_assignments")
    op.drop_table("planner_assignments")
    op.drop_table("planner_profiles")
    op.drop_column("vendor_profiles", "address")
