from marshmallow import Schema, fields, validate


class InvitationSchema(Schema):
    id = fields.String(dump_only=True)
    eventId = fields.String(required=True)
    templateId = fields.String(required=True)
    title = fields.String(required=True, validate=validate.Length(min=1, max=180))
    status = fields.String(
        load_default="draft",
        validate=validate.OneOf(["draft", "published"]),
    )
    design = fields.Dict(keys=fields.String(), load_default=dict)


class InvitationUpdateSchema(Schema):
    title = fields.String(validate=validate.Length(min=1, max=180))
    status = fields.String(validate=validate.OneOf(["draft", "published"]))
    design = fields.Dict(keys=fields.String())
