from app.extensions import db
from app.models.base import BaseModel


class QuotationRequest(BaseModel):
    __tablename__ = "quotations"

    event_id = db.Column(db.String(36), db.ForeignKey("events.id", ondelete="CASCADE"), nullable=False, index=True)
    vendor_id = db.Column(db.String(36), db.ForeignKey("vendor_profiles.id", ondelete="CASCADE"), nullable=False, index=True)
    title = db.Column(db.String(180), nullable=False)
    status = db.Column(db.String(20), nullable=False, default="draft", index=True)
    valid_until = db.Column(db.Date, nullable=True)
    revision = db.Column(db.Integer, nullable=False, default=1)
    previous_quotation_id = db.Column(db.String(36), db.ForeignKey("quotations.id", name="fk_quotation_previous"), nullable=True)
    revised_by = db.Column(db.String(36), nullable=True)
    revised_at = db.Column(db.DateTime(timezone=True), nullable=True)
    requires_fresh_approval = db.Column(db.Boolean, nullable=False, default=False)
    items_snapshot = db.Column(db.JSON, nullable=False, default=dict)
    total_amount = db.Column(db.Numeric(12, 2), nullable=False, default=0)


class QuotationLineItem(BaseModel):
    __tablename__ = "quotation_line_items"

    quotation_id = db.Column(db.String(36), db.ForeignKey("quotations.id", ondelete="CASCADE"), nullable=False, index=True)
    description = db.Column(db.String(255), nullable=False)
    quantity = db.Column(db.Numeric(10, 2), nullable=False, default=1)
    unit_price = db.Column(db.Numeric(12, 2), nullable=False)
    quotation = db.relationship("QuotationRequest", back_populates="items")