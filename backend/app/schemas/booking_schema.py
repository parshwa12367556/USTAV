from marshmallow import Schema, fields, validate


class BookingRequestSchema(Schema):
    eventId = fields.String(required=True)
    vendorId = fields.String(required=True)
    serviceName = fields.String(required=True, validate=validate.Length(min=1, max=180))
    eventDate = fields.Date(required=True)
    amount = fields.Decimal(required=True, as_string=False, validate=validate.Range(min=0))


class BookingStatusSchema(Schema):
    status = fields.String(
        required=True,
        validate=validate.OneOf(["requested", "confirmed", "completed", "cancelled"]),
    )
    note = fields.String(load_default=None, allow_none=True, validate=validate.Length(max=5000))
