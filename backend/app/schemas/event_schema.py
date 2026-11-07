from marshmallow import Schema, fields, validate


class EventSchema(Schema):
    id = fields.String(dump_only=True)
    name = fields.String(required=True, validate=validate.Length(min=2, max=180))
    type = fields.String(required=True, validate=validate.Length(min=1, max=80))
    date = fields.Date(required=True)
    endDate = fields.Date(load_default=None, allow_none=True)
    venue = fields.String(load_default=None, allow_none=True, validate=validate.Length(max=255))
    location = fields.String(load_default=None, allow_none=True, validate=validate.Length(max=255))
    guestCount = fields.Integer(load_default=0, validate=validate.Range(min=0, max=100000))
    budget = fields.Decimal(load_default=None, allow_none=True, as_string=False, validate=validate.Range(min=0))
    status = fields.String(load_default="planning", validate=validate.OneOf(["planning", "confirmed", "completed", "cancelled"]))
    description = fields.String(load_default=None, allow_none=True, validate=validate.Length(max=5000))


class FunctionSchema(Schema):
    id = fields.String(dump_only=True)
    eventId = fields.String(dump_only=True)
    name = fields.String(required=True, validate=validate.Length(min=1, max=120))
    date = fields.Date(required=True)
    venue = fields.String(load_default=None, allow_none=True, validate=validate.Length(max=255))
    guestCount = fields.Integer(load_default=0, validate=validate.Range(min=0, max=100000))
    notes = fields.String(load_default=None, allow_none=True, validate=validate.Length(max=5000))
