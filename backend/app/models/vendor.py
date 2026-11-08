from app.extensions import db
from app.models.base import BaseModel


class VendorProfile(BaseModel):
    __tablename__ = "vendor_profiles"

    user_id = db.Column(db.String(36), db.ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False)
    business_name = db.Column(db.String(180), nullable=False)
    category = db.Column(db.String(100), nullable=False, index=True)
    city = db.Column(db.String(120), nullable=False, index=True)
    address = db.Column(db.String(500), nullable=True)
    rating = db.Column(db.Numeric(2, 1), nullable=False, default=0)
    review_count = db.Column(db.Integer, nullable=False, default=0)
    starting_price = db.Column(db.Numeric(12, 2), nullable=True)
    description = db.Column(db.Text, nullable=True)
    verification_status = db.Column(db.String(20), nullable=False, default="pending", index=True)

    user = db.relationship("User", back_populates="vendor_profile")
    services = db.relationship("Service", back_populates="vendor", cascade="all, delete-orphan")

    def to_dict(self) -> dict[str, object]:
        return {
            "id": self.id,
            "name": self.business_name,
            "category": self.category,
            "city": self.city,
            "rating": float(self.rating),
            "reviewCount": self.review_count,
            "startingPrice": float(self.starting_price) if self.starting_price is not None else None,
            "description": self.description,
            "verified": self.verification_status == "verified",
            "imageUrl": None,
        }


class Service(BaseModel):
    __tablename__ = "vendor_services"

    vendor_id = db.Column(db.String(36), db.ForeignKey("vendor_profiles.id", ondelete="CASCADE"), nullable=False, index=True)
    name = db.Column(db.String(140), nullable=False)
    description = db.Column(db.Text, nullable=True)
    price = db.Column(db.Numeric(12, 2), nullable=False, default=0)
    is_active = db.Column(db.Boolean, nullable=False, default=True)

    vendor = db.relationship("VendorProfile", back_populates="services")


class CateringMenu(BaseModel):
    __tablename__ = "catering_menus"

    vendor_id = db.Column(
        db.String(36),
        db.ForeignKey("vendor_profiles.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    name = db.Column(db.String(140), nullable=False)
    price_per_plate = db.Column(db.Numeric(12, 2), nullable=False)
    description = db.Column(db.Text, nullable=True)
    is_active = db.Column(db.Boolean, nullable=False, default=True)
    vendor = db.relationship("VendorProfile")

    def to_dict(self) -> dict[str, object]:
        return {
            "id": self.id,
            "name": self.name,
            "pricePerPlate": float(self.price_per_plate),
            "description": self.description,
        }


class Package(BaseModel):
    __tablename__ = "vendor_packages"

    vendor_id = db.Column(db.String(36), db.ForeignKey("vendor_profiles.id", ondelete="CASCADE"), nullable=False, index=True)
    name = db.Column(db.String(140), nullable=False)
    description = db.Column(db.Text, nullable=True)
    price = db.Column(db.Numeric(12, 2), nullable=False, default=0)
    inclusions = db.Column(db.JSON, nullable=False, default=list)
    is_active = db.Column(db.Boolean, nullable=False, default=True)


class Portfolio(BaseModel):
    __tablename__ = "vendor_portfolio"

    vendor_id = db.Column(db.String(36), db.ForeignKey("vendor_profiles.id", ondelete="CASCADE"), nullable=False, index=True)
    image_url = db.Column(db.String(500), nullable=False)
    caption = db.Column(db.String(255), nullable=True)


class VendorAvailability(BaseModel):
    __tablename__ = "vendor_availability"
    __table_args__ = (
        db.UniqueConstraint("vendor_id", "date", name="uq_vendor_availability_date"),
    )

    vendor_id = db.Column(
        db.String(36),
        db.ForeignKey("vendor_profiles.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    date = db.Column(db.Date, nullable=False)
    is_available = db.Column(db.Boolean, nullable=False, default=True)
    note = db.Column(db.String(255), nullable=True)