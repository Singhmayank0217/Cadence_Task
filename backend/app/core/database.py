"""Database engine, session factory and declarative base."""

from typing import Generator

from sqlalchemy import create_engine, event
from sqlalchemy.orm import DeclarativeBase, Session, sessionmaker

from app.core.config import settings

# `check_same_thread` is only valid (and required) for SQLite.
connect_args = {"check_same_thread": False} if settings.is_sqlite else {}

engine = create_engine(
    settings.DATABASE_URL,
    echo=settings.SQL_ECHO,
    future=True,
    pool_pre_ping=True,
    connect_args=connect_args,
)


@event.listens_for(engine, "connect")
def _enable_sqlite_foreign_keys(dbapi_connection, _connection_record):
    """SQLite ignores FK constraints unless they are explicitly switched on."""
    if settings.is_sqlite:
        cursor = dbapi_connection.cursor()
        cursor.execute("PRAGMA foreign_keys=ON")
        cursor.close()


SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False, future=True)


class Base(DeclarativeBase):
    """Declarative base shared by every ORM model."""


def get_db() -> Generator[Session, None, None]:
    """FastAPI dependency that yields a request-scoped session."""
    db = SessionLocal()
    try:
        yield db
        db.commit()
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()
