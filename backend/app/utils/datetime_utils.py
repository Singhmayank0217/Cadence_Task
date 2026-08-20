"""Timezone helpers - everything inside the app is UTC aware."""

from datetime import datetime, time, timedelta, timezone
from typing import Optional


def utcnow() -> datetime:
    return datetime.now(timezone.utc)


def ensure_utc(value: Optional[datetime]) -> Optional[datetime]:
    """Normalise naive datetimes (SQLite loses tzinfo) to UTC."""
    if value is None:
        return None
    if value.tzinfo is None:
        return value.replace(tzinfo=timezone.utc)
    return value.astimezone(timezone.utc)


def start_of_day(value: Optional[datetime] = None) -> datetime:
    value = value or utcnow()
    return datetime.combine(value.date(), time.min, tzinfo=timezone.utc)


def end_of_day(value: Optional[datetime] = None) -> datetime:
    value = value or utcnow()
    return datetime.combine(value.date(), time.max, tzinfo=timezone.utc)


def days_from_now(days: int) -> datetime:
    return utcnow() + timedelta(days=days)
