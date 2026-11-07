from app.extensions import db
from app.models.base import BaseModel


class PlatformCategory(BaseModel):
    __tablename__ = "platform_categories"

    name = db.Column(db.String(100), nullable=False, unique=True)
    is_active = db.Column(db.Boolean, nullable=False, default=True, index=True)


class CommissionRule(BaseModel):
    __tablename__ = "commission_rules"
    __table_args__ = (
        db.UniqueConstraint(
            "category_name",
            "effective_from",
            name="uq_commission_rule_category_effective",
        ),
    )

    category_name = db.Column(db.String(100), nullable=False, index=True)
    rate_percent = db.Column(db.Numeric(5, 2), nullable=False)
    effective_from = db.Column(db.Date, nullable=False, index=True)
    created_by_user_id = db.Column(
        db.String(36),
        db.ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
    )
