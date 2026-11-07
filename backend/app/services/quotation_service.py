from decimal import Decimal

from app.extensions import db
from app.models.event import Event
from app.models.quotation import QuotationLineItem, QuotationRequest
from app.models.vendor import VendorProfile


def create_quotation(payload: dict[str, object], vendor: VendorProfile) -> QuotationRequest:
    quotation = QuotationRequest(
        event_id=str(payload["eventId"]),
        vendor_id=vendor.id,
        title=str(payload["title"]).strip(),
        status="draft",
        valid_until=payload.get("validUntil"),
    )
    for item in payload.get("items", []):
        quotation.items.append(
            QuotationLineItem(
                description=str(item["description"]).strip(),
                quantity=Decimal(item.get("quantity", 1)),
                unit_price=Decimal(item["unitPrice"]),
            )
        )
    db.session.add(quotation)
    return quotation


def serialize_quotation(quotation: QuotationRequest) -> dict[str, object]:
    vendor = db.session.get(VendorProfile, quotation.vendor_id)
    event = db.session.get(Event, quotation.event_id)
    items = [
        {
            "id": item.id,
            "description": item.description,
            "quantity": float(item.quantity),
            "unitPrice": float(item.unit_price),
        }
        for item in quotation.items
    ]
    return {
        "id": quotation.id,
        "eventId": quotation.event_id,
        "vendorId": quotation.vendor_id,
        "title": quotation.title,
        "status": quotation.status,
        "items": items,
        "validUntil": quotation.valid_until.isoformat() if quotation.valid_until else None,
        "total": sum(item["quantity"] * item["unitPrice"] for item in items),
        "vendorName": vendor.business_name if vendor else None,
        "eventName": event.name if event else None,
        "eventDate": event.date.isoformat() if event else None,
        "guestCount": event.guest_count if event else None,
    }
