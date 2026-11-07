from flask import Blueprint, request
from flask_jwt_extended import get_jwt_identity, jwt_required
from sqlalchemy import not_, or_

from app.core.exceptions import ApiError
from app.extensions import db
from app.models.user import User
from app.models.platform import PlatformCategory
from app.models.vendor import (
    CateringMenu,
    Package,
    Portfolio,
    Service,
    VendorAvailability,
    VendorProfile,
)
from app.schemas.vendor_schema import (
    PortfolioItemSchema,
    VendorAvailabilitySchema,
    VendorPackageSchema,
    VendorProfileSchema,
    VendorServiceSchema,
)

vendor_bp = Blueprint("vendors", __name__)
vendor_schema = VendorProfileSchema()
service_schema = VendorServiceSchema()
package_schema = VendorPackageSchema()
portfolio_schema = PortfolioItemSchema()
availability_schema = VendorAvailabilitySchema()


def _my_vendor() -> VendorProfile:
    user = db.session.get(User, get_jwt_identity())
    if user is None or user.role != "vendor":
        raise ApiError("A vendor account is required.", 403)
    if user.vendor_profile is None:
        raise ApiError("Create your vendor profile first.", 404)
    return user.vendor_profile


def _owned_vendor_resource(model: type, resource_id: str, label: str):
    item = db.session.get(model, resource_id)
    if item is None or item.vendor_id != db.session.scalar(
        db.select(VendorProfile.id).where(VendorProfile.user_id == get_jwt_identity())
    ):
        raise ApiError(f"{label} not found.", 404)
    return item


def _service_dict(item: Service) -> dict[str, object]:
    return {
        "id": item.id,
        "name": item.name,
        "description": item.description,
        "price": float(item.price),
        "isActive": item.is_active,
    }


def _package_dict(item: Package) -> dict[str, object]:
    return {
        "id": item.id,
        "name": item.name,
        "description": item.description,
        "price": float(item.price),
        "inclusions": item.inclusions or [],
        "isActive": item.is_active,
    }


def _portfolio_dict(item: Portfolio) -> dict[str, object]:
    return {"id": item.id, "imageUrl": item.image_url, "caption": item.caption}


def _availability_dict(item: VendorAvailability) -> dict[str, object]:
    return {
        "id": item.id,
        "date": item.date.isoformat(),
        "isAvailable": item.is_available,
        "note": item.note,
    }


@vendor_bp.get("")
def list_vendors():
    inactive_category = (
        db.select(PlatformCategory.id)
        .where(
            PlatformCategory.name == VendorProfile.category,
            PlatformCategory.is_active.is_(False),
        )
        .exists()
    )
    query = db.select(VendorProfile).where(
        VendorProfile.verification_status == "verified",
        not_(inactive_category),
    )
    category = request.args.get("category", "").strip()
    city = request.args.get("city", "").strip()
    search = request.args.get("search", "").strip()
    if category:
        query = query.where(VendorProfile.category.ilike(f"%{category}%"))
    if city:
        query = query.where(VendorProfile.city.ilike(f"%{city}%"))
    if search:
        pattern = f"%{search}%"
        query = query.where(or_(
            VendorProfile.business_name.ilike(pattern),
            VendorProfile.category.ilike(pattern),
            VendorProfile.city.ilike(pattern),
        ))
    vendors = db.session.scalars(query.order_by(VendorProfile.business_name)).all()
    return [vendor.to_dict() for vendor in vendors]


@vendor_bp.get("/<vendor_id>")
def get_vendor(vendor_id: str):
    vendor = db.session.get(VendorProfile, vendor_id)
    if vendor is None or vendor.verification_status != "verified":
        raise ApiError("Vendor not found.", 404)
    category_active = db.session.scalar(
        db.select(PlatformCategory.is_active).where(
            PlatformCategory.name == vendor.category,
        )
    )
    if category_active is False:
        raise ApiError("Vendor not found.", 404)
    result = vendor.to_dict()
    result["services"] = [
        _service_dict(service)
        for service in vendor.services
        if service.is_active
    ]
    result["packages"] = [
        _package_dict(item)
        for item in db.session.scalars(
            db.select(Package).where(
                Package.vendor_id == vendor.id,
                Package.is_active.is_(True),
            )
        ).all()
    ]
    result["portfolio"] = [
        _portfolio_dict(item)
        for item in db.session.scalars(
            db.select(Portfolio).where(Portfolio.vendor_id == vendor.id)
        ).all()
    ]
    return result


@vendor_bp.post("/profile")
@jwt_required()
def create_vendor_profile():
    user = db.session.get(User, get_jwt_identity())
    if user is None or user.role != "vendor":
        raise ApiError("A vendor account is required.", 403)
    if user.vendor_profile is not None:
        raise ApiError("A vendor profile already exists for this account.", 409)
    payload = vendor_schema.load(request.get_json(silent=True) or {})
    profile = VendorProfile(
        user_id=user.id,
        business_name=payload["name"].strip(),
        category=payload["category"].strip(),
        city=payload["city"].strip(),
        starting_price=payload.get("startingPrice"),
        description=payload.get("description"),
    )
    db.session.add(profile)
    db.session.commit()
    return profile.to_dict(), 201


@vendor_bp.get("/profile/me")
@jwt_required()
def my_vendor_profile():
    vendor = _my_vendor()
    return {
        **vendor.to_dict(),
        "verificationStatus": vendor.verification_status,
    }


@vendor_bp.patch("/profile/me")
@jwt_required()
def update_vendor_profile():
    vendor = _my_vendor()
    payload = vendor_schema.load(request.get_json(silent=True) or {}, partial=True)
    if not payload:
        raise ApiError("At least one profile field is required.")
    mapping = {
        "name": "business_name",
        "category": "category",
        "city": "city",
        "startingPrice": "starting_price",
        "description": "description",
    }
    for key, value in payload.items():
        setattr(vendor, mapping[key], value.strip() if isinstance(value, str) else value)
    vendor.verification_status = "pending"
    db.session.commit()
    return {**vendor.to_dict(), "verificationStatus": vendor.verification_status}


@vendor_bp.get("/profile/me/services")
@jwt_required()
def list_my_services():
    vendor = _my_vendor()
    services = db.session.scalars(
        db.select(Service)
        .where(Service.vendor_id == vendor.id)
        .order_by(Service.created_at.desc())
    ).all()
    return [_service_dict(item) for item in services]


@vendor_bp.post("/profile/me/services")
@jwt_required()
def create_my_service():
    vendor = _my_vendor()
    payload = service_schema.load(request.get_json(silent=True) or {})
    service = Service(
        vendor_id=vendor.id,
        name=payload["name"].strip(),
        description=payload.get("description"),
        price=payload["price"],
        is_active=payload["isActive"],
    )
    db.session.add(service)
    db.session.commit()
    return _service_dict(service), 201


@vendor_bp.patch("/services/<service_id>")
@jwt_required()
def update_my_service(service_id: str):
    service = _owned_vendor_resource(Service, service_id, "Service")
    payload = service_schema.load(request.get_json(silent=True) or {}, partial=True)
    if not payload:
        raise ApiError("At least one service field is required.")
    mapping = {"name": "name", "description": "description", "price": "price", "isActive": "is_active"}
    for key, value in payload.items():
        setattr(service, mapping[key], value.strip() if key == "name" else value)
    db.session.commit()
    return _service_dict(service)


@vendor_bp.delete("/services/<service_id>")
@jwt_required()
def delete_my_service(service_id: str):
    service = _owned_vendor_resource(Service, service_id, "Service")
    db.session.delete(service)
    db.session.commit()
    return "", 204


@vendor_bp.get("/profile/me/packages")
@jwt_required()
def list_my_packages():
    vendor = _my_vendor()
    packages = db.session.scalars(
        db.select(Package)
        .where(Package.vendor_id == vendor.id)
        .order_by(Package.created_at.desc())
    ).all()
    return [_package_dict(item) for item in packages]


@vendor_bp.post("/profile/me/packages")
@jwt_required()
def create_my_package():
    vendor = _my_vendor()
    payload = package_schema.load(request.get_json(silent=True) or {})
    package = Package(
        vendor_id=vendor.id,
        name=payload["name"].strip(),
        description=payload.get("description"),
        price=payload["price"],
        inclusions=payload["inclusions"],
        is_active=payload["isActive"],
    )
    db.session.add(package)
    db.session.commit()
    return _package_dict(package), 201


@vendor_bp.patch("/packages/<package_id>")
@jwt_required()
def update_my_package(package_id: str):
    package = _owned_vendor_resource(Package, package_id, "Package")
    payload = package_schema.load(request.get_json(silent=True) or {}, partial=True)
    if not payload:
        raise ApiError("At least one package field is required.")
    mapping = {
        "name": "name",
        "description": "description",
        "price": "price",
        "inclusions": "inclusions",
        "isActive": "is_active",
    }
    for key, value in payload.items():
        setattr(package, mapping[key], value.strip() if key == "name" else value)
    db.session.commit()
    return _package_dict(package)


@vendor_bp.delete("/packages/<package_id>")
@jwt_required()
def delete_my_package(package_id: str):
    package = _owned_vendor_resource(Package, package_id, "Package")
    db.session.delete(package)
    db.session.commit()
    return "", 204


@vendor_bp.get("/profile/me/portfolio")
@jwt_required()
def list_my_portfolio():
    vendor = _my_vendor()
    items = db.session.scalars(
        db.select(Portfolio)
        .where(Portfolio.vendor_id == vendor.id)
        .order_by(Portfolio.created_at.desc())
    ).all()
    return [_portfolio_dict(item) for item in items]


@vendor_bp.post("/profile/me/portfolio")
@jwt_required()
def create_portfolio_item():
    vendor = _my_vendor()
    payload = portfolio_schema.load(request.get_json(silent=True) or {})
    item = Portfolio(
        vendor_id=vendor.id,
        image_url=payload["imageUrl"].strip(),
        caption=payload.get("caption"),
    )
    db.session.add(item)
    db.session.commit()
    return _portfolio_dict(item), 201


@vendor_bp.delete("/portfolio/<item_id>")
@jwt_required()
def delete_portfolio_item(item_id: str):
    item = _owned_vendor_resource(Portfolio, item_id, "Portfolio item")
    db.session.delete(item)
    db.session.commit()
    return "", 204


@vendor_bp.get("/profile/me/availability")
@jwt_required()
def list_my_availability():
    vendor = _my_vendor()
    items = db.session.scalars(
        db.select(VendorAvailability)
        .where(VendorAvailability.vendor_id == vendor.id)
        .order_by(VendorAvailability.date)
    ).all()
    return [_availability_dict(item) for item in items]


@vendor_bp.put("/profile/me/availability")
@jwt_required()
def set_my_availability():
    vendor = _my_vendor()
    payload = availability_schema.load(request.get_json(silent=True) or {})
    item = db.session.scalar(
        db.select(VendorAvailability).where(
            VendorAvailability.vendor_id == vendor.id,
            VendorAvailability.date == payload["date"],
        )
    )
    if item is None:
        item = VendorAvailability(vendor_id=vendor.id, date=payload["date"])
        db.session.add(item)
    item.is_available = payload["isAvailable"]
    item.note = payload.get("note")
    db.session.commit()
    return _availability_dict(item)


@vendor_bp.delete("/profile/me/availability/<availability_id>")
@jwt_required()
def delete_my_availability(availability_id: str):
    item = _owned_vendor_resource(VendorAvailability, availability_id, "Availability")
    db.session.delete(item)
    db.session.commit()
    return "", 204


@vendor_bp.get("/<vendor_id>/services")
def list_services(vendor_id: str):
    vendor = db.session.get(VendorProfile, vendor_id)
    if vendor is None or vendor.verification_status != "verified":
        raise ApiError("Vendor not found.", 404)
    services = db.session.scalars(
        db.select(Service).where(Service.vendor_id == vendor.id, Service.is_active.is_(True))
    ).all()
    return [
        {
            "id": item.id,
            "name": item.name,
            "description": item.description,
            "price": float(item.price),
        }
        for item in services
    ]


@vendor_bp.get("/<vendor_id>/menus")
def list_catering_menus(vendor_id: str):
    vendor = db.session.get(VendorProfile, vendor_id)
    if (
        vendor is None
        or vendor.verification_status != "verified"
        or "cater" not in vendor.category.lower()
    ):
        raise ApiError("Caterer not found.", 404)
    menus = db.session.scalars(
        db.select(CateringMenu)
        .where(CateringMenu.vendor_id == vendor.id, CateringMenu.is_active.is_(True))
        .order_by(CateringMenu.name)
    ).all()
    return [menu.to_dict() for menu in menus]


@vendor_bp.post("/<vendor_id>/menus")
@jwt_required()
def create_catering_menu(vendor_id: str):
    vendor = db.session.get(VendorProfile, vendor_id)
    if vendor is None or vendor.user_id != get_jwt_identity():
        raise ApiError("Vendor profile not found.", 404)
    if "cater" not in vendor.category.lower():
        raise ApiError("Only catering vendors can add menus.")
    body = request.get_json(silent=True) or {}
    name = body.get("name")
    description = body.get("description")
    try:
        price_per_plate = float(body.get("pricePerPlate"))
    except (TypeError, ValueError) as error:
        raise ApiError("A valid price per plate is required.") from error
    if not isinstance(name, str) or not name.strip():
        raise ApiError("Menu name is required.")
    if price_per_plate < 0:
        raise ApiError("Price per plate must be non-negative.")
    if description is not None and not isinstance(description, str):
        raise ApiError("Menu description must be text.")
    menu = CateringMenu(
        vendor_id=vendor.id,
        name=name.strip(),
        description=description.strip() if description else None,
        price_per_plate=price_per_plate,
    )
    db.session.add(menu)
    db.session.commit()
    return menu.to_dict(), 201


@vendor_bp.post("/<vendor_id>/services")
@jwt_required()
def create_service(vendor_id: str):
    vendor = db.session.get(VendorProfile, vendor_id)
    if vendor is None or vendor.user_id != get_jwt_identity():
        raise ApiError("Vendor profile not found.", 404)
    body = request.get_json(silent=True) or {}
    name = body.get("name")
    price = body.get("price", 0)
    if not isinstance(name, str) or not name.strip():
        raise ApiError("Service name is required.")
    try:
        price = float(price)
    except (TypeError, ValueError) as error:
        raise ApiError("Service price must be a non-negative number.") from error
    if price < 0:
        raise ApiError("Service price must be a non-negative number.")
    service = Service(
        vendor_id=vendor.id,
        name=name.strip(),
        description=body.get("description"),
        price=price,
    )
    db.session.add(service)
    db.session.commit()
    return {
        "id": service.id,
        "name": service.name,
        "description": service.description,
        "price": float(service.price),
    }, 201
