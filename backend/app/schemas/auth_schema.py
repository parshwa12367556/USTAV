from marshmallow import Schema, fields, validate


class LoginSchema(Schema):
    email = fields.Email(required=True)
    password = fields.String(required=True, validate=validate.Length(min=8, max=128), load_only=True)
    membershipId = fields.String(load_default=None, allow_none=True, validate=validate.Length(max=80))


class RegisterSchema(Schema):
    name = fields.String(required=True, validate=validate.Length(min=2, max=120))
    email = fields.Email(required=True)
    phone = fields.String(load_default=None, allow_none=True, validate=validate.Length(max=20))
    password = fields.String(required=True, validate=validate.Length(min=12, max=128), load_only=True)
    role = fields.String(load_default="family", validate=validate.OneOf(["family", "vendor"]))


class FamilyRegistrationSchema(Schema):
    name = fields.String(required=True, validate=validate.Length(min=2, max=120))
    email = fields.Email(required=True)
    phone = fields.String(load_default=None, allow_none=True, validate=validate.Length(max=20))
    password = fields.String(required=True, validate=validate.Length(min=12, max=128), load_only=True)
    workspaceName = fields.String(required=True, validate=validate.Length(min=2, max=160))


class VendorRegistrationSchema(Schema):
    name = fields.String(required=True, validate=validate.Length(min=2, max=120))
    email = fields.Email(required=True)
    phone = fields.String(load_default=None, allow_none=True, validate=validate.Length(max=20))
    password = fields.String(required=True, validate=validate.Length(min=12, max=128), load_only=True)
    businessName = fields.String(required=True, validate=validate.Length(min=2, max=180))
    category = fields.String(required=True, validate=validate.Length(min=2, max=100))
    city = fields.String(required=True, validate=validate.Length(min=2, max=120))
    address = fields.String(required=True, validate=validate.Length(min=5, max=500))
    description = fields.String(load_default=None, allow_none=True, validate=validate.Length(max=5000))


class PlannerRegistrationSchema(Schema):
    name = fields.String(required=True, validate=validate.Length(min=2, max=120))
    email = fields.Email(required=True)
    phone = fields.String(load_default=None, allow_none=True, validate=validate.Length(max=20))
    password = fields.String(required=True, validate=validate.Length(min=12, max=128), load_only=True)
    companyName = fields.String(load_default=None, allow_none=True, validate=validate.Length(max=180))
    yearsExperience = fields.Integer(load_default=None, allow_none=True, validate=validate.Range(min=0, max=80))


class OTPSchema(Schema):
    email = fields.Email(required=True)
    code = fields.String(required=True, validate=validate.Regexp(r"^\d{6}$"))


class PasswordResetRequestSchema(Schema):
    email = fields.Email(required=True)


class PasswordResetSchema(Schema):
    email = fields.Email(required=True)
    code = fields.String(required=True, validate=validate.Regexp(r"^\d{6}$"))
    newPassword = fields.String(
        required=True,
        validate=validate.Length(min=12, max=128),
        load_only=True,
    )


class ProfileUpdateSchema(Schema):
    name = fields.String(validate=validate.Length(min=2, max=120))
    phone = fields.String(allow_none=True, validate=validate.Length(max=20))


class MembershipSwitchSchema(Schema):
    membershipId = fields.String(required=True, validate=validate.Length(min=1, max=80))


class SessionRevokeSchema(Schema):
    sessionId = fields.String(required=True, validate=validate.Length(min=1, max=80))


class PasswordChangeSchema(Schema):
    currentPassword = fields.String(required=True, load_only=True, validate=validate.Length(min=8, max=128))
    newPassword = fields.String(required=True, load_only=True, validate=validate.Length(min=12, max=128))


class TotpVerifySchema(Schema):
    code = fields.String(required=True, validate=validate.Regexp(r"^(?:\d{6}|[A-Fa-f0-9]{10})$"))
