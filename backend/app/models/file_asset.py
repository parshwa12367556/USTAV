from app.extensions import db
from app.models.base import BaseModel
from datetime import datetime, timezone
from sqlalchemy import UniqueConstraint
from uuid import uuid4


class FileAsset(BaseModel):
    __tablename__ = "file_assets"

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid4()))
    original_filename = db.Column(db.String(255), nullable=False)
    storage_filename = db.Column(db.String(64), nullable=False, unique=True)
    storage_key = db.Column(db.String(128), nullable=False, unique=True)
    mime_type = db.Column(db.String(100), nullable=True)
    file_extension = db.Column(db.String(20), nullable=False)
    file_size = db.Column(db.Integer, nullable=True)
    sha256_checksum = db.Column(db.String(64), nullable=True, unique=True)
    resource_type = db.Column(db.String(50), nullable=False)
    resource_id = db.Column(db.String(36), nullable=True, index=True)
    family_id = db.Column(
        db.String(36), db.ForeignKey("family_workspaces.id", ondelete="SET NULL"), nullable=True, index=True
    )
    vendor_id = db.Column(
        db.String(36), db.ForeignKey("vendor_profiles.id", ondelete="SET NULL"), nullable=True, index=True
    )
    uploaded_by = db.Column(
        db.String(36), db.ForeignKey("users.id", ondelete="SET NULL"), nullable=False
    )
    uploaded_at = db.Column(
        db.DateTime(timezone=True), nullable=False, default=lambda: datetime.now(timezone.utc)
    )
    scan_status = db.Column(db.String(20), nullable=False, default="pending")
    scan_completed_at = db.Column(db.DateTime(timezone=True), nullable=True)
    deletion_status = db.Column(db.String(20), nullable=False, default="active")
    deleted_at = db.Column(db.DateTime(timezone=True), nullable=True)
    deleted_by = db.Column(db.String(36), db.ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    created_at = db.Column(
        db.DateTime(timezone=True), nullable=False, default=lambda: datetime.now(timezone.utc)
    )
    updated_at = db.Column(
        db.DateTime(timezone=True), nullable=True, default=lambda: datetime.now(timezone.utc)
    )

    # Relationships
    uploader = db.relationship("User", backref="uploaded_files")
    family = db.relationship("FamilyWorkspace", backref="file_assets")
    vendor = db.relationship("VendorProfile", backref="file_assets")
    user = db.relationship("User", backref="uploaded_files")

    __table_args__ = (
        db.Index("ix_file_assets_resource", "resource_type", "resource_id"),
        db.Index("ix_file_assets_family", "family_id"),
        db.Index("ix_file_assets_vendor", "vendor_id"),
        db.Index("ix_file_assets_uploaded_by", "uploaded_by"),
        db.Index("ix_file_assets_scan_status", "scan_status"),
    )