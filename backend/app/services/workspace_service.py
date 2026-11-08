from app.core.exceptions import ApiError
from app.extensions import db
from app.models.event import Event
from app.models.user import User
from app.models.workspace import (
    FamilyMembership,
    FamilyMembershipPermission,
    FamilyWorkspace,
)


WORKSPACE_PERMISSIONS = {
    "event.view",
    "event.create",
    "event.update",
    "event.delete",
    "function.manage",
    "guest.view",
    "guest.create",
    "guest.update",
    "guest.delete",
    "invitation.view",
    "invitation.create",
    "invitation.update",
    "quotation.view",
    "quotation.create",
    "quotation.update",
    "booking.view",
    "booking.create",
    "booking.update",
    "payment.view",
    "payment.manage",
    "budget.view",
    "budget.manage",
    "task.manage",
}


def ensure_family_workspace(user: User) -> FamilyWorkspace:
    if user.role != "family":
        raise ApiError("A family owner account is required.", 403)
    workspace = db.session.scalar(
        db.select(FamilyWorkspace).where(FamilyWorkspace.owner_user_id == user.id)
    )
    if workspace is None:
        existing_membership = db.session.scalar(
            db.select(FamilyMembership.id).where(FamilyMembership.user_id == user.id)
        )
        if existing_membership is not None:
            raise ApiError("Only a family workspace owner can perform this action.", 403)
        workspace = FamilyWorkspace(owner_user_id=user.id, name=f"{user.name}'s Family")
        db.session.add(workspace)
        db.session.flush()
    membership = db.session.scalar(
        db.select(FamilyMembership).where(
            FamilyMembership.workspace_id == workspace.id,
            FamilyMembership.user_id == user.id,
        )
    )
    if membership is None:
        db.session.add(
            FamilyMembership(
                workspace_id=workspace.id,
                user_id=user.id,
                role="owner",
                status="active",
            )
        )
        db.session.flush()
    return workspace


def user_has_event_permission(
    user_id: str,
    event: Event | None,
    permission: str,
    membership_id: str | None = None,
) -> bool:
    if event is None:
        return False
    workspace = db.session.scalar(
        db.select(FamilyWorkspace).where(FamilyWorkspace.owner_user_id == event.owner_id)
    )
    if membership_id is None:
        return event.owner_id == user_id
    membership = db.session.get(FamilyMembership, membership_id)
    if (
        membership is None
        or membership.user_id != user_id
        or membership.status != "active"
        or workspace is None
        or membership.workspace_id != workspace.id
    ):
        return False
    if membership.role == "owner":
        return True
    return db.session.scalar(
        db.select(FamilyMembershipPermission.id).where(
            FamilyMembershipPermission.membership_id == membership.id,
            FamilyMembershipPermission.permission == permission,
        )
    ) is not None


def accessible_event_ids(
    user_id: str,
    permission: str,
    membership_id: str | None = None,
):
    if membership_id is None:
        return db.select(Event.id).where(Event.owner_id == user_id)
    membership = db.session.get(FamilyMembership, membership_id)
    if (
        membership is None
        or membership.user_id != user_id
        or membership.status != "active"
    ):
        return db.select(Event.id).where(db.false())
    workspace = db.session.get(FamilyWorkspace, membership.workspace_id)
    if workspace is None:
        return db.select(Event.id).where(db.false())
    query = db.select(Event.id).where(Event.owner_id == workspace.owner_user_id)
    if membership.role != "owner":
        query = query.join(
            FamilyMembershipPermission,
            FamilyMembershipPermission.membership_id == membership.id,
        ).where(FamilyMembershipPermission.permission == permission)
    return query


def require_event_permission(
    user_id: str,
    event: Event | None,
    permission: str,
    membership_id: str | None = None,
) -> Event:
    if event is None or not user_has_event_permission(
        user_id, event, permission, membership_id
    ):
        raise ApiError("Event not found.", 404)
    return event
