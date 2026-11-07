from flask import Blueprint

from app.api.admin_routes import admin_bp
from app.api.auth_routes import auth_bp
from app.api.budget_routes import budget_bp
from app.api.booking_routes import booking_bp
from app.api.dashboard_routes import dashboard_bp
from app.api.event_routes import event_bp
from app.api.guest_routes import guest_bp
from app.api.invitation_routes import invitation_bp
from app.api.payment_routes import payment_bp
from app.api.quotation_routes import quotation_bp
from app.api.rsvp_routes import rsvp_bp
from app.api.upload_routes import upload_bp
from app.api.venue_routes import venue_bp
from app.api.vendor_routes import vendor_bp
from app.api.vendor_staff_routes import vendor_staff_bp
from app.api.workspace_routes import workspace_bp

api_v1 = Blueprint("api_v1", __name__)
api_v1.register_blueprint(auth_bp, url_prefix="/auth")
api_v1.register_blueprint(admin_bp, url_prefix="/admin")
api_v1.register_blueprint(budget_bp, url_prefix="/budget")
api_v1.register_blueprint(event_bp)
api_v1.register_blueprint(guest_bp)
api_v1.register_blueprint(invitation_bp, url_prefix="/invitations")
api_v1.register_blueprint(rsvp_bp, url_prefix="/rsvp")
api_v1.register_blueprint(quotation_bp, url_prefix="/quotations")
api_v1.register_blueprint(payment_bp, url_prefix="/payments")
api_v1.register_blueprint(upload_bp, url_prefix="/upload")
api_v1.register_blueprint(vendor_bp, url_prefix="/vendors")
api_v1.register_blueprint(vendor_staff_bp, url_prefix="/vendors")
api_v1.register_blueprint(venue_bp, url_prefix="/venues")
api_v1.register_blueprint(booking_bp, url_prefix="/bookings")
api_v1.register_blueprint(dashboard_bp, url_prefix="/dashboard")
api_v1.register_blueprint(workspace_bp)
