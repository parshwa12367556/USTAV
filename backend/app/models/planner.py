from app.extensions import db
from app.models.base import BaseModel


class PlannerProfile(BaseModel):
    __tablename__ = "planner_profiles"

    user_id = db.Column(
        db.String(36),
        db.ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        unique=True,
    )
    company_name = db.Column(db.String(180), nullable=True)
    years_experience = db.Column(db.Integer, nullable=True)

    user = db.relationship("User", back_populates="planner_profile")


class PlannerAssignment(BaseModel):
    __tablename__ = "planner_assignments"

    planner_user_id = db.Column(
        db.String(36),
        db.ForeignKey("planner_profiles.user_id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    workspace_id = db.Column(
        db.String(36),
        db.ForeignKey("family_workspaces.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    membership_id = db.Column(
        db.String(36),
        db.ForeignKey("family_memberships.id", ondelete="CASCADE"),
        nullable=False,
        unique=True,
    )
    assigned_by_user_id = db.Column(
        db.String(36),
        db.ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
    )
    status = db.Column(db.String(20), nullable=False, default="active")

    planner = db.relationship("PlannerProfile")
    workspace = db.relationship("FamilyWorkspace")
    membership = db.relationship("FamilyMembership")
