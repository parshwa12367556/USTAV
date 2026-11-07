from app.core.permissions import roles_required

login_required = roles_required("family", "vendor", "admin", "guest")
role_required = roles_required