from datetime import datetime, timedelta, timezone
from uuid import uuid4

from flask import current_app

from app.extensions import db
from app.models.base import BaseModel


class GuestGroup(BaseModel):
    __tablename__ = "guest_groups"
    __table_args__ = (db.UniqueConstraint("event_id", "name", name="uq_guest_group_name"),)

    event_id = db.Column(db.String(36), db.ForeignKey("events.id", ondelete="CASCADE"), nullable=False, index=True)
    name = db.Column(db.String(100), nullable=False)
    event = db.relationship("Event")
    guests = db.relationship("Guest", back_populates="group", cascade="all")


class Guest(BaseModel):
    __tablename__ = "guests"

    event_id = db.Column(db.String(36), db.ForeignKey("events.id", ondelete="CASCADE"), nullable=False, index=True)
    group_id = db.Column(db.String(36), db.ForeignKey("guest_groups.id", ondelete="SET NULL"), nullable=True)
    name = db.Column(db.String(120), nullable=False)
    email = db.Column(db.String(255), nullable=True)
    phone = db.Column(db.String(20), nullable=True)
    rsvp_status = db.Column(db.String(20), nullable=False, default="pending")
    plus_ones = db.Column(db.Integer, nullable=False, default=0)
    invitation_token = db.Column(db.String(48), unique=True, nullable=False, default=lambda: uuid4().hex)
    invitation_expires_at = db.Column(
        db.DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc)
        + timedelta(days=current_app.config["INVITATION_TOKEN_EXPIRY_DAYS"]),
    )

    event = db.relationship("Event", back_populates="guests")
    group = db.relationship("GuestGroup", back_populates="guests")
    rsvps = db.relationship("RSVP", back_populates="guest", cascade="all, delete-orphan")
    function_mappings = db.relationship(
        "GuestFunctionMapping",
        back_populates="guest",
        cascade="all, delete-orphan",
        lazy="selectin",
    )

    def to_dict(self) -> dict[str, object]:
        invited_function_ids = [mapping.function_id for mapping in self.function_mappings]
        if not invited_function_ids:
            invited_function_ids = [function.id for function in self.event.functions]
        return {
            "id": self.id,
            "eventId": self.event_id,
            "name": self.name,
            "email": self.email,
            "phone": self.phone,
            "group": self.group.name if self.group else None,
            "rsvpStatus": self.rsvp_status,
            "plusOnes": self.plus_ones,
            "invitationToken": self.invitation_token,
            "invitationExpiresAt": self.invitation_expires_at.isoformat(),
            "invitedFunctionIds": invited_function_ids,
            "functionRsvps": [
                {
                    "functionId": response.function_id,
                    "functionName": response.function.name,
                    "status": response.status,
                    "plusOnes": response.plus_ones,
                }
                for response in self.rsvps
                if response.function_id is not None
            ],
        }


class GuestFunctionMapping(BaseModel):
    __tablename__ = "guest_function_mappings"
    __table_args__ = (
        db.UniqueConstraint("guest_id", "function_id", name="uq_guest_function"),
    )

    guest_id = db.Column(db.String(36), db.ForeignKey("guests.id", ondelete="CASCADE"), nullable=False)
    function_id = db.Column(db.String(36), db.ForeignKey("event_functions.id", ondelete="CASCADE"), nullable=False)

    guest = db.relationship("Guest", back_populates="function_mappings")
    function = db.relationship("Function")