from app.extensions import db
from app.models.base import BaseModel


class VendorMembership(BaseModel):
    __tablename__ = "vendor_memberships"
    __table_args__ = (
        db.UniqueConstraint("vendor_id", "user_id", name="uq_vendor_membership_user"),
    )

    vendor_id = db.Column(
        db.String(36),
        db.ForeignKey("vendor_profiles.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    user_id = db.Column(
        db.String(36),
        db.ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    role = db.Column(db.String(20), nullable=False, default="staff")
    status = db.Column(db.String(20), nullable=False, default="active")
    user = db.relationship("User")
    assignments = db.relationship(
        "VendorBookingAssignment",
        back_populates="membership",
        cascade="all, delete-orphan",
    )


class VendorMembershipPermission(BaseModel):
    __tablename__ = "vendor_membership_permissions"
    __table_args__ = (
        db.UniqueConstraint("membership_id", "permission", name="uq_vendor_membership_permission"),
    )

    membership_id = db.Column(
        db.String(36),
        db.ForeignKey("vendor_memberships.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    permission = db.Column(db.String(80), nullable=False)


class VendorStaffInvitation(BaseModel):
    __tablename__ = "vendor_staff_invitations"

    vendor_id = db.Column(
        db.String(36),
        db.ForeignKey("vendor_profiles.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    email = db.Column(db.String(255), nullable=False, index=True)
    token_hash = db.Column(db.String(64), nullable=False, unique=True)
    status = db.Column(db.String(20), nullable=False, default="pending")
    expires_at = db.Column(db.DateTime(timezone=True), nullable=False)
    invited_by_user_id = db.Column(
        db.String(36),
        db.ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
    )


class VendorBookingAssignment(BaseModel):
    __tablename__ = "vendor_booking_assignments"
    __table_args__ = (
        db.UniqueConstraint("booking_id", "membership_id", name="uq_vendor_booking_assignment"),
    )

    booking_id = db.Column(
        db.String(36),
        db.ForeignKey("bookings.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    membership_id = db.Column(
        db.String(36),
        db.ForeignKey("vendor_memberships.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    assigned_by_user_id = db.Column(
        db.String(36),
        db.ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
    )
    booking = db.relationship("Booking", back_populates="staff_assignments")
    membership = db.relationship("VendorMembership", back_populates="assignments")
