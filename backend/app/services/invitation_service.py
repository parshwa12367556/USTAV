from datetime import datetime, timedelta, timezone
from secrets import token_urlsafe

from flask import current_app

from app.models.invitation import UserInvitation
from app.utils.token_security import generate_bearer_token, hash_bearer_token


def publish_invitation(invitation: UserInvitation) -> str:
    invitation.status = "published"
    token = generate_bearer_token()
    invitation.share_token_hash = hash_bearer_token(token)
    invitation.share_expires_at = datetime.now(timezone.utc) + timedelta(
        days=current_app.config["INVITATION_TOKEN_EXPIRY_DAYS"]
    )
    return token
