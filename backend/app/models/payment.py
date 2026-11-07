from app.extensions import db
from app.models.base import BaseModel


class Payment(BaseModel):
    __tablename__ = "payments"

    booking_id = db.Column(db.String(36), db.ForeignKey("bookings.id", ondelete="SET NULL"), nullable=True, index=True)
    invoice_number = db.Column(db.String(40), unique=True, nullable=False)
    amount = db.Column(db.Numeric(12, 2), nullable=False)
    currency = db.Column(db.String(3), nullable=False, default="INR")
    status = db.Column(db.String(20), nullable=False, default="pending", index=True)
    paid_at = db.Column(db.DateTime(timezone=True), nullable=True)

    def to_dict(self) -> dict[str, object]:
        return {
            "id": self.id,
            "bookingId": self.booking_id,
            "invoiceNumber": self.invoice_number,
            "amount": float(self.amount),
            "currency": self.currency,
            "status": self.status,
            "paidAt": self.paid_at.isoformat() if self.paid_at else None,
        }


class Transaction(BaseModel):
    __tablename__ = "transactions"

    payment_id = db.Column(db.String(36), db.ForeignKey("payments.id", ondelete="CASCADE"), nullable=False, index=True)
    provider = db.Column(db.String(40), nullable=False)
    provider_reference = db.Column(db.String(120), unique=True, nullable=True)
    status = db.Column(db.String(30), nullable=False)
    response_data = db.Column(db.JSON, nullable=False, default=dict)


class Invoice(BaseModel):
    __tablename__ = "invoices"

    payment_id = db.Column(db.String(36), db.ForeignKey("payments.id", ondelete="CASCADE"), nullable=False, unique=True)
    pdf_path = db.Column(db.String(500), nullable=True)