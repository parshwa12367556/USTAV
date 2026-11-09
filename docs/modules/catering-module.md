# Catering module

## Current implementation status

The backend has a `CateringMenu` model associated with a vendor, containing menu name, per-plate price, description, and active state. Vendor API routes include menu reads and a menu creation route. The repository also contains generic vendor services/packages and booking/quotation flows.

## Not established

A complete catering-specific ordering workflow, menu-item composition, dietary/allergen management, guest count reconciliation, service fulfillment, or end-to-end browser integration is not established by the presence of the model alone. Verify the frontend flow and API contract before advertising these as available.

## Security and data handling

Only the owning vendor should manage its menus. Public catalogue reads should return active offerings and exclude private vendor data. Allergens or dietary restrictions may reveal health-related preferences; collect only what is needed and disclose their handling.

## Relevant sources

`backend/app/models/vendor.py`, `backend/app/api/vendor_routes.py`, vendor schemas, and `backend/tests/test_vendor_menus.py`.