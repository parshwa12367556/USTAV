from datetime import date

from flask import Blueprint, request
from flask_jwt_extended import get_jwt_identity, jwt_required
from marshmallow import Schema, fields, validate

from app.core.exceptions import ApiError
from app.extensions import db
from app.models.budget import BudgetCategory, Expense
from app.models.event import Event
from app.services.workspace_service import require_event_permission

budget_bp = Blueprint("budget", __name__)


class CategorySchema(Schema):
    name = fields.String(required=True, validate=validate.Length(min=1, max=120))
    allocated = fields.Decimal(required=True, as_string=False, validate=validate.Range(min=0))
    color = fields.String(load_default=None, allow_none=True, validate=validate.Length(max=20))


class ExpenseSchema(Schema):
    categoryId = fields.String(required=True)
    description = fields.String(required=True, validate=validate.Length(min=1, max=180))
    amount = fields.Decimal(required=True, as_string=False, validate=validate.Range(min=0.01))
    date = fields.Date(required=True)
    paid = fields.Boolean(load_default=False)


category_schema = CategorySchema()
expense_schema = ExpenseSchema()


def _owned_event(event_id: str, permission: str) -> Event:
    event = db.session.get(Event, event_id)
    return require_event_permission(get_jwt_identity(), event, permission)


@budget_bp.get("/events/<event_id>/budget")
@jwt_required()
def get_budget(event_id: str):
    event = _owned_event(event_id, "budget.view")
    categories = db.session.scalars(
        db.select(BudgetCategory).where(BudgetCategory.event_id == event.id)
    ).all()
    total_spent = sum(
        float(expense.amount)
        for category in categories
        for expense in category.expenses
    )
    return {
        "eventId": event.id,
        "budget": float(event.budget) if event.budget is not None else 0,
        "spent": total_spent,
        "categories": [
            {
                "id": category.id,
                "name": category.name,
                "allocated": float(category.allocated),
                "spent": sum(float(item.amount) for item in category.expenses),
                "color": category.color,
            }
            for category in categories
        ],
    }


@budget_bp.post("/events/<event_id>/budget/categories")
@jwt_required()
def create_budget_category(event_id: str):
    event = _owned_event(event_id, "budget.manage")
    payload = category_schema.load(request.get_json(silent=True) or {})
    category = BudgetCategory(
        event_id=event.id,
        name=payload["name"].strip(),
        allocated=payload["allocated"],
        color=payload.get("color"),
    )
    db.session.add(category)
    db.session.commit()
    return {"id": category.id, "name": category.name, "allocated": float(category.allocated), "spent": 0, "color": category.color}, 201


@budget_bp.post("/events/<event_id>/expenses")
@jwt_required()
def create_expense(event_id: str):
    event = _owned_event(event_id, "budget.manage")
    payload = expense_schema.load(request.get_json(silent=True) or {})
    category = db.session.get(BudgetCategory, payload["categoryId"])
    if category is None or category.event_id != event.id:
        raise ApiError("Budget category not found.", 404)
    expense = Expense(
        category_id=category.id,
        description=payload["description"].strip(),
        amount=payload["amount"],
        date=payload["date"],
        paid=payload["paid"],
    )
    db.session.add(expense)
    db.session.commit()
    return {
        "id": expense.id,
        "eventId": event.id,
        "categoryId": category.id,
        "description": expense.description,
        "amount": float(expense.amount),
        "date": expense.date.isoformat(),
        "paid": expense.paid,
    }, 201
