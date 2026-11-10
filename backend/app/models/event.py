from app.extensions import db
from datetime import datetime, timezone
from app.models.base import BaseModel


class Event(BaseModel):
    __tablename__ = "events"

    owner_id = db.Column(db.String(36), db.ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    name = db.Column(db.String(180), nullable=False)
    event_type = db.Column(db.String(80), nullable=False)
    date = db.Column(db.Date, nullable=False, index=True)
    end_date = db.Column(db.Date, nullable=True)
    rsvp_deadline = db.Column(db.DateTime(timezone=True), nullable=True, index=True)
    guest_count = db.Column(db.Integer, nullable=False, default=0)
    budget = db.Column(db.Numeric(12, 2), nullable=True)
    status = db.Column(db.String(20), nullable=False, default="planning", index=True)
    description = db.Column(db.Text, nullable=True)

    owner = db.relationship("User", back_populates="events")
    functions = db.relationship("Function", back_populates="event", cascade="all, delete-orphan")
    guests = db.relationship("Guest", back_populates="event", cascade="all, delete-orphan")
    budget_categories = db.relationship("BudgetCategory", back_populates="event", cascade="all, delete-orphan")

    def to_dict(self) -> dict[str, object]:
        return {
            "id": self.id,
            "name": self.name,
            "type": self.event_type,
            "date": self.date.isoformat(),
            "endDate": self.end_date.isoformat() if self.end_date else None,
            "venue": self.venue,
            "location": self.location,
            "guestCount": self.guest_count,
            "budget": float(self.budget) if self.budget is not None else None,
            "status": self.status,
            "description": self.description,
        }

    @property
    def rsvp_deadline_passed(self) -> bool:
        if self.rsvp_deadline is None:
            return False
        return self.rsvp_deadline <= datetime.now(timezone.utc)


class Function(BaseModel):
    __tablename__ = "event_functions"

    event_id = db.Column(db.String(36), db.ForeignKey("events.id", ondelete="CASCADE"), nullable=False, index=True)
    name = db.Column(db.String(120), nullable=False)
    date = db.Column(db.Date, nullable=False)
    venue = db.Column(db.String(255), nullable=True)
    guest_count = db.Column(db.Integer, nullable=False, default=0)
    notes = db.Column(db.Text, nullable=True)

    event = db.relationship("Event", back_populates="functions")
    rsvps = db.relationship("RSVP", back_populates="function", cascade="all, delete-orphan")

    def to_dict(self) -> dict[str, object]:
        return {
            "id": self.id,
            "eventId": self.event_id,
            "name": self.name,
            "date": self.date.isoformat(),
            "venue": self.venue,
            "guestCount": self.guest_count,
            "notes": self.notes,
        }