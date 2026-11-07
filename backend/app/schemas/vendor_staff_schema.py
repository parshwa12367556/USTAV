from marshmallow import Schema, fields


class VendorStaffInvitationSchema(Schema):
    email = fields.Email(required=True)


class VendorStaffAcceptInvitationSchema(Schema):
    token = fields.String(required=True)


class VendorStaffAssignmentSchema(Schema):
    membershipId = fields.String(required=True)
