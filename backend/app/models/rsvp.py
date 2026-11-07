from app.extensions import db
from app.models.base import BaseModel


class RSVP(BaseModel):
    __tablename__ = "rsvps"
    __table_args__ = (
        db.UniqueConstraint("guest_id", "function_id", name="uq_rsvp_guest_function"),
    )

    guest_id = db.Column(db.String(36), db.ForeignKey("guests.id", ondelete="CASCADE"), nullable=False, index=True)
    function_id = db.Column(db.String(36), db.ForeignKey("event_functions.id", ondelete="CASCADE"), nullable=True)
    status = db.Column(db.String(20), nullable=False, default="pending")
    plus_ones = db.Column(db.Integer, nullable=False, default=0)
    dietary_notes = db.Column(db.Text, nullable=True)

    guest = db.relationship("Guest", back_populates="rsvps")
    function = db.relationship("Function", back_populates="rsvps")
