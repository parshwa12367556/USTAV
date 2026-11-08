from app.extensions import db
from app.models.base import BaseModel


class User(BaseModel):
    __tablename__ = "users"

    name = db.Column(db.String(120), nullable=False)
    email = db.Column(db.String(255), unique=True, nullable=False, index=True)
    phone = db.Column(db.String(20), nullable=True)
    password_hash = db.Column(db.String(255), nullable=False)
    role = db.Column(db.String(20), nullable=False, default="family", index=True)
    is_active = db.Column(db.Boolean, nullable=False, default=True)
    is_verified = db.Column(db.Boolean, nullable=False, default=False)
    otp_hash = db.Column(db.String(255), nullable=True)
    otp_expires_at = db.Column(db.DateTime(timezone=True), nullable=True)
    password_reset_hash = db.Column(db.String(255), nullable=True)
    password_reset_expires_at = db.Column(db.DateTime(timezone=True), nullable=True)

    events = db.relationship("Event", back_populates="owner", cascade="all, delete-orphan")
    vendor_profile = db.relationship(
        "VendorProfile", back_populates="user", uselist=False, cascade="all, delete-orphan"
    )
    planner_profile = db.relationship(
        "PlannerProfile", back_populates="user", uselist=False, cascade="all, delete-orphan"
    )

    def to_dict(self) -> dict[str, object]:
        return {
            "id": self.id,
            "name": self.name,
            "email": self.email,
            "phone": self.phone,
            "role": self.role,
            "avatarUrl": None,
        }