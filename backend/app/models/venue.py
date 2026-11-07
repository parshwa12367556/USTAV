from app.extensions import db
from app.models.base import BaseModel


class Venue(BaseModel):
    __tablename__ = "venues"

    vendor_id = db.Column(db.String(36), db.ForeignKey("vendor_profiles.id", ondelete="SET NULL"), nullable=True, index=True)
    name = db.Column(db.String(180), nullable=False)
    city = db.Column(db.String(120), nullable=False, index=True)
    capacity = db.Column(db.Integer, nullable=False)
    price_per_day = db.Column(db.Numeric(12, 2), nullable=False)
    amenities = db.Column(db.JSON, nullable=False, default=list)
    image_url = db.Column(db.String(500), nullable=True)
    is_active = db.Column(db.Boolean, nullable=False, default=True)

    availability = db.relationship("VenueAvailability", back_populates="venue", cascade="all, delete-orphan")

    def to_dict(self) -> dict[str, object]:
        return {
            "id": self.id,
            "name": self.name,
            "city": self.city,
            "capacity": self.capacity,
            "pricePerDay": float(self.price_per_day),
            "amenities": self.amenities or [],
            "imageUrl": self.image_url,
            "availableDates": [],
        }


class VenueAvailability(BaseModel):
    __tablename__ = "venue_availability"
    __table_args__ = (db.UniqueConstraint("venue_id", "date", name="uq_venue_availability_date"),)

    venue_id = db.Column(db.String(36), db.ForeignKey("venues.id", ondelete="CASCADE"), nullable=False, index=True)
    date = db.Column(db.Date, nullable=False)
    is_available = db.Column(db.Boolean, nullable=False, default=True)
    venue = db.relationship("Venue", back_populates="availability")