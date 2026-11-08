from marshmallow import Schema, fields, validate


class WorkspaceInvitationSchema(Schema):
    email = fields.Email(required=True)
    role = fields.String(required=True, validate=validate.OneOf(["member", "planner"]))
    permissions = fields.List(
        fields.String(validate=validate.Length(min=3, max=80)),
        load_default=list,
        validate=validate.Length(max=30),
    )


class AcceptWorkspaceInvitationSchema(Schema):
    token = fields.String(required=True, validate=validate.Length(min=40, max=100))
    name = fields.String(load_default=None, allow_none=True, validate=validate.Length(min=2, max=120))
    password = fields.String(load_default=None, allow_none=True, validate=validate.Length(min=8, max=128), load_only=True)


class UpdateWorkspaceMembershipSchema(Schema):
    role = fields.String(validate=validate.OneOf(["member", "planner"]))
    permissions = fields.List(
        fields.String(validate=validate.Length(min=3, max=80)),
        validate=validate.Length(max=30),
    )
