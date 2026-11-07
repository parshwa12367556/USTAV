from datetime import date

from flask import Blueprint, request
from flask_jwt_extended import get_jwt_identity, jwt_required

from app.core.exceptions import ApiError
from app.extensions import db
from app.models.venue import Venue, VenueAvailability

venue_bp = Blueprint("venues", __name__)


@venue_bp.get("")
def list_venues():
    query = db.select(Venue).where(Venue.is_active.is_(True))
    city = request.args.get("city", "").strip()
    if city:
        query = query.where(Venue.city.ilike(f"%{city}%"))
    min_capacity = request.args.get("minCapacity")
    max_price = request.args.get("maxPrice")
    try:
        if min_capacity:
            query = query.where(Venue.capacity >= int(min_capacity))
        if max_price:
            query = query.where(Venue.price_per_day <= float(max_price))
    except ValueError as error:
        raise ApiError("Capacity and price filters must be valid numbers.") from error
    venues = db.session.scalars(query.order_by(Venue.name)).all()
    return [venue.to_dict() for venue in venues]


@venue_bp.get("/<venue_id>")
def get_venue(venue_id: str):
    venue = db.session.get(Venue, venue_id)
    if venue is None or not venue.is_active:
        raise ApiError("Venue not found.", 404)
    result = venue.to_dict()
    result["availableDates"] = [
        row.date.isoformat()
        for row in venue.availability
        if row.is_available
    ]
    return result


@venue_bp.get("/<venue_id>/availability")
def get_venue_availability(venue_id: str):
    venue = db.session.get(Venue, venue_id)
    if venue is None or not venue.is_active:
        raise ApiError("Venue not found.", 404)
    return [
        {"date": row.date.isoformat(), "available": row.is_available}
        for row in venue.availability
    ]


@venue_bp.put("/<venue_id>/availability")
@jwt_required()
def set_venue_availability(venue_id: str):
    venue = db.session.get(Venue, venue_id)
    if venue is None or venue.vendor_id is None:
        raise ApiError("Venue not found.", 404)
    from app.models.vendor import VendorProfile

    profile = db.session.get(VendorProfile, venue.vendor_id)
    if profile is None or profile.user_id != get_jwt_identity():
        raise ApiError("You cannot update this venue's availability.", 403)
    body = request.get_json(silent=True) or {}
    values = body.get("dates")
    if not isinstance(values, list):
        raise ApiError("dates must be a list.")
    for item in values:
        if not isinstance(item, dict) or not isinstance(item.get("date"), str) or not isinstance(item.get("available"), bool):
            raise ApiError("Each availability entry requires a date and available boolean.")
        try:
            parsed_date = date.fromisoformat(item["date"])
        except ValueError as error:
            raise ApiError(f"Invalid availability date: {item['date']}") from error
        record = db.session.scalar(
            db.select(VenueAvailability).where(
                VenueAvailability.venue_id == venue.id,
                VenueAvailability.date == parsed_date,
            )
        )
        if record is None:
            record = VenueAvailability(venue_id=venue.id, date=parsed_date)
            db.session.add(record)
        record.is_available = item["available"]
    db.session.commit()
    return {"message": "Availability saved."}
