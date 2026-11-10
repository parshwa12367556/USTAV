import re

from marshmallow import Schema, ValidationError, fields, validate


def validate_phone(value: str) -> None:
    if not value.strip():
        return
    normalized = re.sub(r"[().\s-]", "", value)
    if not re.fullmatch(r"\+?[1-9]\d{7,14}", normalized):
        raise ValidationError("Enter a valid phone number.")


def normalize_phone(value: str | None) -> str | None:
    if value is None or not value.strip():
        return None
    return re.sub(r"[().\s-]", "", value)


class GuestSchema(Schema):
    id = fields.String(dump_only=True)
    eventId = fields.String(dump_only=True)
    name = fields.String(required=True, validate=validate.Length(min=2, max=120))
    email = fields.Email(load_default=None, allow_none=True)
    phone = fields.String(
        load_default=None,
        allow_none=True,
        validate=[validate.Length(max=20), validate_phone],
    )
    group = fields.String(load_default=None, allow_none=True, validate=validate.Length(max=100))
    rsvpStatus = fields.String(dump_only=True)
    plusOnes = fields.Integer(load_default=0, validate=validate.Range(min=0, max=20))
    maxAttendees = fields.Integer(load_default=21, validate=validate.Range(min=1, max=21))


class GuestGroupSchema(Schema):
    id = fields.String(dump_only=True)
    name = fields.String(required=True, validate=validate.Length(min=1, max=100))
    guestCount = fields.Integer(dump_only=True)
