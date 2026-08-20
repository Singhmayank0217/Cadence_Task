"""Create tables (and optionally seed) on startup.

A real deployment would use Alembic migrations; `create_all` keeps the take-home
runnable with a single command.
"""

import logging

from app.core.database import Base, engine
from app.models import Activity, Comment, Task, User  # noqa: F401  (registers tables)

logger = logging.getLogger("cadence.db")


def init_db() -> None:
    Base.metadata.create_all(bind=engine)
    logger.info("Database tables are ready.")
