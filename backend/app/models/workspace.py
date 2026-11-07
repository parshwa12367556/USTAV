from app.extensions import db
from app.models.base import BaseModel


class FamilyWorkspace(BaseModel):
    __tablename__ = "family_workspaces"

    owner_user_id = db.Column(
        db.String(36),
        db.ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        unique=True,
    )
    name = db.Column(db.String(160), nullable=False)


class FamilyMembership(BaseModel):
    __tablename__ = "family_memberships"
    __table_args__ = (
        db.UniqueConstraint("workspace_id", "user_id", name="uq_family_membership_user"),
    )

    workspace_id = db.Column(
        db.String(36),
        db.ForeignKey("family_workspaces.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    user_id = db.Column(
        db.String(36),
        db.ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    role = db.Column(db.String(20), nullable=False)
    status = db.Column(db.String(20), nullable=False, default="active")


class FamilyMembershipPermission(BaseModel):
    __tablename__ = "family_membership_permissions"
    __table_args__ = (
        db.UniqueConstraint("membership_id", "permission", name="uq_family_membership_permission"),
    )

    membership_id = db.Column(
        db.String(36),
        db.ForeignKey("family_memberships.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    permission = db.Column(db.String(80), nullable=False)


class FamilyWorkspaceInvitation(BaseModel):
    __tablename__ = "family_workspace_invitations"

    workspace_id = db.Column(
        db.String(36),
        db.ForeignKey("family_workspaces.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    email = db.Column(db.String(255), nullable=False, index=True)
    role = db.Column(db.String(20), nullable=False)
    token_hash = db.Column(db.String(64), nullable=False, unique=True)
    status = db.Column(db.String(20), nullable=False, default="pending")
    expires_at = db.Column(db.DateTime(timezone=True), nullable=False)
    invited_by_user_id = db.Column(
        db.String(36),
        db.ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
    )


class FamilyWorkspaceInvitationPermission(BaseModel):
    __tablename__ = "family_workspace_invitation_permissions"
    __table_args__ = (
        db.UniqueConstraint(
            "invitation_id",
            "permission",
            name="uq_family_workspace_invitation_permission",
        ),
    )

    invitation_id = db.Column(
        db.String(36),
        db.ForeignKey("family_workspace_invitations.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    permission = db.Column(db.String(80), nullable=False)
