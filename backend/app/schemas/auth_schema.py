from marshmallow import Schema, fields, validate


class LoginSchema(Schema):
    email = fields.Email(required=True)
    password = fields.String(required=True, validate=validate.Length(min=8, max=128), load_only=True)


class RegisterSchema(Schema):
    name = fields.String(required=True, validate=validate.Length(min=2, max=120))
    email = fields.Email(required=True)
    phone = fields.String(load_default=None, allow_none=True, validate=validate.Length(max=20))
    password = fields.String(required=True, validate=validate.Length(min=8, max=128), load_only=True)
    role = fields.String(load_default="family", validate=validate.OneOf(["family", "vendor"]))


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
        validate=validate.Length(min=8, max=128),
        load_only=True,
    )


class ProfileUpdateSchema(Schema):
    name = fields.String(validate=validate.Length(min=2, max=120))
    phone = fields.String(allow_none=True, validate=validate.Length(max=20))
