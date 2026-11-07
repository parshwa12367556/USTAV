from flask import Blueprint, request
from flask_jwt_extended import get_jwt, get_jwt_identity, jwt_required

from app.core.exceptions import ApiError
from app.extensions import db
from app.models.event import Event
from app.models.quotation import QuotationLineItem, QuotationRequest
from app.models.vendor import VendorProfile
from app.schemas.quotation_schema import (
    QuotationCreateSchema,
    QuotationStatusSchema,
    QuotationVendorReplySchema,
)
from app.services.quotation_service import create_quotation, serialize_quotation
from app.services.workspace_service import (
    accessible_event_ids,
    require_event_permission,
    user_has_event_permission,
)

quotation_bp = Blueprint("quotations", __name__)
create_schema = QuotationCreateSchema()
status_schema = QuotationStatusSchema()
vendor_reply_schema = QuotationVendorReplySchema()


@quotation_bp.get("")
@jwt_required()
def list_quotations():
    role = get_jwt().get("role")
    if role == "vendor":
        vendor_id = db.session.scalar(
            db.select(VendorProfile.id).where(VendorProfile.user_id == get_jwt_identity())
        )
        if vendor_id is None:
            return []
        query = db.select(QuotationRequest).where(QuotationRequest.vendor_id == vendor_id)
    else:
        query = db.select(QuotationRequest).where(
            QuotationRequest.event_id.in_(
                accessible_event_ids(get_jwt_identity(), "quotation.view")
            )
        )
    event_id = request.args.get("eventId")
    if event_id:
        query = query.where(QuotationRequest.event_id == event_id)
    quotations = db.session.scalars(query.order_by(QuotationRequest.created_at.desc())).all()
    return [serialize_quotation(item) for item in quotations]


@quotation_bp.post("")
@jwt_required()
def create_quotation_request():
    payload = create_schema.load(request.get_json(silent=True) or {})
    event = db.session.get(Event, payload["eventId"])
    require_event_permission(get_jwt_identity(), event, "quotation.create")
    vendor = db.session.get(VendorProfile, payload["vendorId"])
    if vendor is None or vendor.verification_status != "verified":
        raise ApiError("Verified vendor not found.", 404)
    quotation = create_quotation(payload, vendor)
    db.session.commit()
    return serialize_quotation(quotation), 201


@quotation_bp.patch("/<quotation_id>")
@jwt_required()
def update_quotation_status(quotation_id: str):
    quotation = db.session.get(QuotationRequest, quotation_id)
    event = db.session.get(Event, quotation.event_id) if quotation else None
    if quotation is None or event is None:
        raise ApiError("Quotation not found.", 404)
    user_id = get_jwt_identity()
    is_event_owner = user_has_event_permission(user_id, event, "quotation.update")
    vendor = db.session.get(VendorProfile, quotation.vendor_id)
    is_vendor_owner = vendor is not None and vendor.user_id == user_id
    if not is_event_owner and not is_vendor_owner:
        raise ApiError("Quotation not found.", 404)
    if is_vendor_owner:
        payload = vendor_reply_schema.load(request.get_json(silent=True) or {})
        if quotation.status != "draft":
            raise ApiError("Only draft quotation requests can receive a vendor reply.", 409)
        if "title" in payload:
            quotation.title = payload["title"].strip()
        quotation.valid_until = payload.get("validUntil")
        quotation.items = [
            QuotationLineItem(
                description=item["description"].strip(),
                quantity=item["quantity"],
                unit_price=item["unitPrice"],
            )
            for item in payload["items"]
        ]
    else:
        payload = status_schema.load(request.get_json(silent=True) or {})
        if payload["status"] != quotation.status and (
            quotation.status != "sent"
            or payload["status"] not in {"accepted", "declined"}
        ):
            raise ApiError(
                f"Cannot change quotation status from {quotation.status} to {payload['status']}.",
                409,
            )
    status = payload["status"]
    if is_vendor_owner and status != "sent":
        raise ApiError("Vendors can only send quotations.", 409)
    quotation.status = status
    db.session.commit()
    return serialize_quotation(quotation)
