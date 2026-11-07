from app.extensions import db
from app.models.base import BaseModel


class Booking(BaseModel):
    __tablename__ = "bookings"

    event_id = db.Column(db.String(36), db.ForeignKey("events.id", ondelete="CASCADE"), nullable=False, index=True)
    vendor_id = db.Column(db.String(36), db.ForeignKey("vendor_profiles.id", ondelete="RESTRICT"), nullable=False, index=True)
    service_name = db.Column(db.String(180), nullable=False)
    event_date = db.Column(db.Date, nullable=False)
    amount = db.Column(db.Numeric(12, 2), nullable=False)
    status = db.Column(db.String(20), nullable=False, default="requested", index=True)
    vendor = db.relationship("VendorProfile")
    event = db.relationship("Event")
    history = db.relationship("BookingStatusHistory", back_populates="booking", cascade="all, delete-orphan")
    staff_assignments = db.relationship(
        "VendorBookingAssignment",
        back_populates="booking",
        cascade="all, delete-orphan",
    )

    def to_dict(self) -> dict[str, object]:
        return {
            "id": self.id,
            "eventId": self.event_id,
            "eventName": self.event.name,
            "vendorId": self.vendor_id,
            "vendorName": self.vendor.business_name,
            "serviceName": self.service_name,
            "eventDate": self.event_date.isoformat(),
            "amount": float(self.amount),
            "status": self.status,
            "createdAt": self.created_at.isoformat(),
            "assignedStaff": [
                {
                    "membershipId": assignment.membership_id,
                    "userId": assignment.membership.user_id,
                    "name": assignment.membership.user.name,
                }
                for assignment in self.staff_assignments
            ],
        }


class BookingStatusHistory(BaseModel):
    __tablename__ = "booking_status_history"

    booking_id = db.Column(db.String(36), db.ForeignKey("bookings.id", ondelete="CASCADE"), nullable=False, index=True)
    status = db.Column(db.String(20), nullable=False)
    note = db.Column(db.Text, nullable=True)
    booking = db.relationship("Booking", back_populates="history")