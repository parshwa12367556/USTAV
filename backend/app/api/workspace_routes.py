from datetime import datetime, timedelta, timezone
from hashlib import sha256
import secrets

from flask import Blueprint, request
from flask_jwt_extended import get_jwt_identity, jwt_required
from marshmallow import ValidationError

from app.core.exceptions import ApiError
from app.extensions import db
from app.models.user import User
from app.models.workspace import (
    FamilyMembership,
    FamilyMembershipPermission,
    FamilyWorkspaceInvitation,
    FamilyWorkspaceInvitationPermission,
)
from app.schemas.workspace_schema import (
    AcceptWorkspaceInvitationSchema,
    UpdateWorkspaceMembershipSchema,
    WorkspaceInvitationSchema,
)
from app.services.workspace_service import WORKSPACE_PERMISSIONS, ensure_family_workspace


workspace_bp = Blueprint("workspace", __name__)
invitation_schema = WorkspaceInvitationSchema()
accept_schema = AcceptWorkspaceInvitationSchema()
membership_schema = UpdateWorkspaceMembershipSchema()


def _owner_workspace():
    user = db.session.get(User, get_jwt_identity())
    if user is None or user.role != "family":
        raise ApiError("Only a family workspace owner can manage members.", 403)
    return ensure_family_workspace(user)


def _permissions(values: list[str]) -> list[str]:
    invalid = sorted(set(values) - WORKSPACE_PERMISSIONS)
    if invalid:
        raise ValidationError({"permissions": [f"Unknown permissions: {', '.join(invalid)}"]})
    return sorted(set(values))


def _membership_dict(membership: FamilyMembership) -> dict[str, object]:
    user = db.session.get(User, membership.user_id)
    permissions = db.session.scalars(
        db.select(FamilyMembershipPermission.permission)
        .where(FamilyMembershipPermission.membership_id == membership.id)
        .order_by(FamilyMembershipPermission.permission)
    ).all()
    return {
        "id": membership.id,
        "userId": membership.user_id,
        "name": user.name if user else "",
        "email": user.email if user else "",
        "role": membership.role,
        "status": membership.status,
        "permissions": permissions,
    }


@workspace_bp.get("/workspace/members")
@jwt_required()
def list_members():
    workspace = _owner_workspace()
    memberships = db.session.scalars(
        db.select(FamilyMembership)
        .where(FamilyMembership.workspace_id == workspace.id)
        .order_by(FamilyMembership.created_at)
    ).all()
    return [_membership_dict(item) for item in memberships]


@workspace_bp.post("/workspace/invitations")
@jwt_required()
def create_invitation():
    workspace = _owner_workspace()
    payload = invitation_schema.load(request.get_json(silent=True) or {})
    email = payload["email"].strip().lower()
    user = db.session.scalar(db.select(User).where(User.email == email))
    if user and db.session.scalar(
        db.select(FamilyMembership.id).where(
            FamilyMembership.workspace_id == workspace.id,
            FamilyMembership.user_id == user.id,
        )
    ):
        raise ApiError("This user is already a member of the workspace.", 409)

    pending = db.session.scalars(
        db.select(FamilyWorkspaceInvitation).where(
            FamilyWorkspaceInvitation.workspace_id == workspace.id,
            FamilyWorkspaceInvitation.email == email,
            FamilyWorkspaceInvitation.status == "pending",
        )
    ).all()
    for existing in pending:
        existing.status = "revoked"
    raw_token = secrets.token_urlsafe(32)
    invitation = FamilyWorkspaceInvitation(
        workspace_id=workspace.id,
        email=email,
        role=payload["role"],
        token_hash=sha256(raw_token.encode("utf-8")).hexdigest(),
        status="pending",
        expires_at=datetime.now(timezone.utc) + timedelta(days=7),
        invited_by_user_id=get_jwt_identity(),
    )
    db.session.add(invitation)
    db.session.flush()
    for permission in _permissions(payload["permissions"]):
        db.session.add(
            FamilyWorkspaceInvitationPermission(
                invitation_id=invitation.id,
                permission=permission,
            )
        )
    db.session.commit()
    return {
        "id": invitation.id,
        "email": invitation.email,
        "role": invitation.role,
        "status": invitation.status,
        "expiresAt": invitation.expires_at.isoformat(),
        "acceptanceToken": raw_token,
    }, 201


@workspace_bp.post("/workspace/invitations/accept")
@jwt_required()
def accept_invitation():
    payload = accept_schema.load(request.get_json(silent=True) or {})
    token_hash = sha256(payload["token"].encode("utf-8")).hexdigest()
    invitation = db.session.scalar(
        db.select(FamilyWorkspaceInvitation).where(
            FamilyWorkspaceInvitation.token_hash == token_hash,
            FamilyWorkspaceInvitation.status == "pending",
        )
    )
    user = db.session.get(User, get_jwt_identity())
    if invitation is None or user is None or invitation.email != user.email.lower():
        raise ApiError("Workspace invitation is invalid or unavailable.", 404)
    expires_at = invitation.expires_at
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)
    if expires_at <= datetime.now(timezone.utc):
        invitation.status = "expired"
        db.session.commit()
        raise ApiError("Workspace invitation has expired.", 410)

    membership = FamilyMembership(
        workspace_id=invitation.workspace_id,
        user_id=user.id,
        role=invitation.role,
        status="active",
    )
    db.session.add(membership)
    db.session.flush()
    permissions = db.session.scalars(
        db.select(FamilyWorkspaceInvitationPermission.permission).where(
            FamilyWorkspaceInvitationPermission.invitation_id == invitation.id
        )
    ).all()
    for permission in permissions:
        db.session.add(
            FamilyMembershipPermission(
                membership_id=membership.id,
                permission=permission,
            )
        )
    invitation.status = "accepted"
    db.session.commit()
    return {"membership": _membership_dict(membership)}


@workspace_bp.patch("/workspace/members/<membership_id>")
@jwt_required()
def update_member(membership_id: str):
    workspace = _owner_workspace()
    membership = db.session.get(FamilyMembership, membership_id)
    if membership is None or membership.workspace_id != workspace.id or membership.role == "owner":
        raise ApiError("Workspace member not found.", 404)
    payload = membership_schema.load(request.get_json(silent=True) or {})
    if not payload:
        raise ValidationError({"_schema": ["At least one field is required."]})
    if "role" in payload:
        membership.role = payload["role"]
    if "permissions" in payload:
        permissions = _permissions(payload["permissions"])
        db.session.execute(
            db.delete(FamilyMembershipPermission).where(
                FamilyMembershipPermission.membership_id == membership.id
            )
        )
        db.session.add_all(
            FamilyMembershipPermission(membership_id=membership.id, permission=value)
            for value in permissions
        )
    db.session.commit()
    return _membership_dict(membership)


@workspace_bp.delete("/workspace/members/<membership_id>")
@jwt_required()
def remove_member(membership_id: str):
    workspace = _owner_workspace()
    membership = db.session.get(FamilyMembership, membership_id)
    if membership is None or membership.workspace_id != workspace.id or membership.role == "owner":
        raise ApiError("Workspace member not found.", 404)
    db.session.delete(membership)
    db.session.commit()
    return "", 204
