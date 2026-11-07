from app.extensions import db
from app.models.base import BaseModel


class Organization(BaseModel):
    __tablename__ = "organizations"

    name = db.Column(db.String(180), nullable=False)
    owner_id = db.Column(db.String(36), db.ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)