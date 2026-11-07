from marshmallow import Schema, fields, validate


class VendorProfileSchema(Schema):
    id = fields.String(dump_only=True)
    name = fields.String(required=True, validate=validate.Length(min=2, max=180))
    category = fields.String(required=True, validate=validate.Length(min=2, max=100))
    city = fields.String(required=True, validate=validate.Length(min=2, max=120))
    rating = fields.Float(dump_only=True)
    reviewCount = fields.Integer(dump_only=True)
    startingPrice = fields.Decimal(load_default=None, allow_none=True, as_string=False, validate=validate.Range(min=0))
    description = fields.String(load_default=None, allow_none=True, validate=validate.Length(max=5000))
    verified = fields.Boolean(dump_only=True)
    imageUrl = fields.String(dump_only=True)


class VendorServiceSchema(Schema):
    id = fields.String(dump_only=True)
    name = fields.String(required=True, validate=validate.Length(min=2, max=140))
    description = fields.String(load_default=None, allow_none=True, validate=validate.Length(max=5000))
    price = fields.Decimal(required=True, as_string=False, validate=validate.Range(min=0))
    isActive = fields.Boolean(load_default=True)


class VendorPackageSchema(Schema):
    id = fields.String(dump_only=True)
    name = fields.String(required=True, validate=validate.Length(min=2, max=140))
    description = fields.String(load_default=None, allow_none=True, validate=validate.Length(max=5000))
    price = fields.Decimal(required=True, as_string=False, validate=validate.Range(min=0))
    inclusions = fields.List(
        fields.String(validate=validate.Length(min=1, max=255)),
        load_default=list,
        validate=validate.Length(max=50),
    )
    isActive = fields.Boolean(load_default=True)


class PortfolioItemSchema(Schema):
    id = fields.String(dump_only=True)
    imageUrl = fields.String(required=True, validate=validate.Length(min=1, max=500))
    caption = fields.String(load_default=None, allow_none=True, validate=validate.Length(max=255))


class VendorAvailabilitySchema(Schema):
    id = fields.String(dump_only=True)
    date = fields.Date(required=True)
    isAvailable = fields.Boolean(required=True)
    note = fields.String(load_default=None, allow_none=True, validate=validate.Length(max=255))
