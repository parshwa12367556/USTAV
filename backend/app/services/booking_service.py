from app.core.exceptions import ApiError
from app.extensions import db
from app.models.booking import Booking, BookingStatusHistory


STATUS_TRANSITIONS = {
    "requested": {"confirmed", "cancelled"},
    "confirmed": {"completed", "cancelled"},
    "completed": set(),
    "cancelled": set(),
}


def transition_booking(booking: Booking, status: str, note: str | None = None) -> None:
    if status not in STATUS_TRANSITIONS:
        raise ApiError("A valid booking status is required.")
    if status != booking.status and status not in STATUS_TRANSITIONS[booking.status]:
        raise ApiError(
            f"Cannot change booking status from {booking.status} to {status}.",
            409,
        )
    if status == booking.status:
        return
    booking.status = status
    booking.history.append(BookingStatusHistory(status=status, note=note))
    db.session.commit()
