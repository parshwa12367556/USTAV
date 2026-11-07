from datetime import date, datetime, timezone


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


def parse_iso_date(value: str) -> date:
    return date.fromisoformat(value)