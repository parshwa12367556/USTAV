from app.extensions import db
from app.models.base import BaseModel


class InvitationTemplate(BaseModel):
    __tablename__ = "invitation_templates"

    name = db.Column(db.String(140), nullable=False)
    category = db.Column(db.String(80), nullable=False)
    preview_url = db.Column(db.String(500), nullable=True)
    price = db.Column(db.Numeric(10, 2), nullable=False, default=0)
    is_published = db.Column(db.Boolean, nullable=False, default=True)


class UserInvitation(BaseModel):
    __tablename__ = "user_invitations"

    event_id = db.Column(db.String(36), db.ForeignKey("events.id", ondelete="CASCADE"), nullable=False, index=True)
    template_id = db.Column(db.String(36), db.ForeignKey("invitation_templates.id", ondelete="RESTRICT"), nullable=False)
    title = db.Column(db.String(180), nullable=False)
    status = db.Column(db.String(20), nullable=False, default="draft")
    design = db.Column(db.JSON, nullable=False, default=dict)
    share_token = db.Column(db.String(48), unique=True, nullable=True)
    share_expires_at = db.Column(db.DateTime(timezone=True), nullable=True)