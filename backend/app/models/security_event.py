from app.extensions import db
from app.models.base import BaseModel


class SecurityEvent(BaseModel):
    __tablename__ = "security_events"

    user_id = db.Column(
        db.String(36),
        db.ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    event_type = db.Column(db.String(80), nullable=False, index=True)
    result = db.Column(db.String(24), nullable=False)
    resource_type = db.Column(db.String(80), nullable=True)
    resource_id = db.Column(db.String(36), nullable=True)
    ip_address = db.Column(db.String(45), nullable=True)
    user_agent = db.Column(db.String(512), nullable=True)
    metadata_json = db.Column(db.JSON, nullable=False, default=dict)

    user = db.relationship("User")
