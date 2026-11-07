from app.extensions import db
from app.models.base import BaseModel


class FamilyMember(BaseModel):
    __tablename__ = "family_members"
    __table_args__ = (
        db.UniqueConstraint("user_id", "family_user_id", name="uq_family_member_pair"),
    )

    user_id = db.Column(db.String(36), db.ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    family_user_id = db.Column(db.String(36), db.ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    relationship = db.Column(db.String(80), nullable=True)