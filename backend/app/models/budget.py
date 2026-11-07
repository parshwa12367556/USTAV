from app.extensions import db
from app.models.base import BaseModel


class BudgetCategory(BaseModel):
    __tablename__ = "budget_categories"
    __table_args__ = (db.UniqueConstraint("event_id", "name", name="uq_budget_category_event_name"),)

    event_id = db.Column(db.String(36), db.ForeignKey("events.id", ondelete="CASCADE"), nullable=False, index=True)
    name = db.Column(db.String(120), nullable=False)
    allocated = db.Column(db.Numeric(12, 2), nullable=False, default=0)
    color = db.Column(db.String(20), nullable=True)
    event = db.relationship("Event", back_populates="budget_categories")
    expenses = db.relationship("Expense", back_populates="category", cascade="all, delete-orphan")


class Expense(BaseModel):
    __tablename__ = "expenses"

    category_id = db.Column(db.String(36), db.ForeignKey("budget_categories.id", ondelete="CASCADE"), nullable=False, index=True)
    description = db.Column(db.String(180), nullable=False)
    amount = db.Column(db.Numeric(12, 2), nullable=False)
    date = db.Column(db.Date, nullable=False)
    paid = db.Column(db.Boolean, nullable=False, default=False)
    category = db.relationship("BudgetCategory", back_populates="expenses")
