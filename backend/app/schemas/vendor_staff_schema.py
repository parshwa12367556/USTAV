from marshmallow import Schema, fields
from marshmallow import validate


class VendorStaffInvitationSchema(Schema):
    email = fields.Email(required=True)


class VendorStaffAcceptInvitationSchema(Schema):
    token = fields.String(required=True)
    name = fields.String(load_default=None, allow_none=True, validate=validate.Length(min=2, max=120))
    password = fields.String(load_default=None, allow_none=True, load_only=True, validate=validate.Length(min=8, max=128))


class VendorStaffAssignmentSchema(Schema):
    membershipId = fields.String(required=True)
