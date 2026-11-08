from marshmallow import Schema, fields, validate


class GuestSchema(Schema):
    id = fields.String(dump_only=True)
    eventId = fields.String(dump_only=True)
    name = fields.String(required=True, validate=validate.Length(min=2, max=120))
    email = fields.Email(load_default=None, allow_none=True)
    phone = fields.String(load_default=None, allow_none=True, validate=validate.Length(max=20))
    group = fields.String(load_default=None, allow_none=True, validate=validate.Length(max=100))
    rsvpStatus = fields.String(dump_only=True)
    plusOnes = fields.Integer(load_default=0, validate=validate.Range(min=0, max=20))


class GuestGroupSchema(Schema):
    id = fields.String(dump_only=True)
    name = fields.String(required=True, validate=validate.Length(min=1, max=100))
    guestCount = fields.Integer(dump_only=True)
