from flask import g, request

from app.extensions import db
from app.models.security_event import SecurityEvent


def record_security_event(
    event_type: str,
    result: str,
    *,
    user_id: str | None = None,
    resource_type: str | None = None,
    resource_id: str | None = None,
    metadata: dict[str, object] | None = None,
) -> None:
    db.session.add(
        SecurityEvent(
            user_id=user_id,
            event_type=event_type,
            result=result,
            resource_type=resource_type,
            resource_id=resource_id,
            ip_address=request.remote_addr,
            user_agent=(request.user_agent.string or "")[:512] or None,
            metadata_json={**(metadata or {}), "request_id": getattr(g, "request_id", None)},
        )
    )
