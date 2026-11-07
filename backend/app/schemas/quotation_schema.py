from marshmallow import Schema, fields, validate


class QuotationLineItemSchema(Schema):
    id = fields.String(dump_only=True)
    description = fields.String(required=True, validate=validate.Length(min=1, max=255))
    quantity = fields.Decimal(
        load_default=1,
        as_string=False,
        validate=validate.Range(min=0.01, max=100000),
    )
    unitPrice = fields.Decimal(
        required=True,
        as_string=False,
        validate=validate.Range(min=0),
    )


class QuotationCreateSchema(Schema):
    eventId = fields.String(required=True)
    vendorId = fields.String(required=True)
    title = fields.String(required=True, validate=validate.Length(min=2, max=180))
    validUntil = fields.Date(load_default=None, allow_none=True)
    items = fields.List(
        fields.Nested(QuotationLineItemSchema),
        load_default=list,
        validate=validate.Length(max=100),
    )


class QuotationStatusSchema(Schema):
    status = fields.String(
        required=True,
        validate=validate.OneOf(["sent", "accepted", "declined"]),
    )


class QuotationVendorReplySchema(Schema):
    status = fields.String(required=True, validate=validate.OneOf(["sent"]))
    title = fields.String(validate=validate.Length(min=2, max=180))
    validUntil = fields.Date(load_default=None, allow_none=True)
    items = fields.List(
        fields.Nested(QuotationLineItemSchema),
        required=True,
        validate=validate.Length(min=1, max=100),
    )
