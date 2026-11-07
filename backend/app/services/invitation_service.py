from datetime import datetime, timedelta, timezone
from secrets import token_urlsafe

from flask import current_app

from app.models.invitation import UserInvitation


def publish_invitation(invitation: UserInvitation) -> None:
    was_published = invitation.status == "published"
    invitation.status = "published"
    if invitation.share_token is None or not was_published:
        invitation.share_token = token_urlsafe(24)
    invitation.share_expires_at = datetime.now(timezone.utc) + timedelta(
        days=current_app.config["INVITATION_TOKEN_EXPIRY_DAYS"]
    )
