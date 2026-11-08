from datetime import datetime, timezone

from app.extensions import db
from app.models.base import BaseModel


class UserSession(BaseModel):
    __tablename__ = "user_sessions"

    user_id = db.Column(
        db.String(36),
        db.ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    refresh_token_hash = db.Column(db.String(64), nullable=False)
    current_refresh_jti = db.Column(db.String(36), nullable=False, unique=True)
    device_name = db.Column(db.String(120), nullable=False)
    device_type = db.Column(db.String(40), nullable=False)
    browser = db.Column(db.String(80), nullable=False)
    operating_system = db.Column(db.String(80), nullable=False)
    ip_address = db.Column(db.String(45), nullable=True)
    user_agent = db.Column(db.String(512), nullable=True)
    last_activity_at = db.Column(
        db.DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
    )
    expires_at = db.Column(db.DateTime(timezone=True), nullable=False)
    revoked_at = db.Column(db.DateTime(timezone=True), nullable=True)

    user = db.relationship("User")
