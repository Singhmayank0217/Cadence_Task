"""Shared FastAPI dependencies."""

from typing import Optional

from fastapi import Depends, Header, Query
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.exceptions import UnauthorizedError
from app.core.security import decode_access_token
from app.models import User
from app.repositories import UserRepository
from app.utils.pagination import DEFAULT_LIMIT, MAX_LIMIT, PageParams


def get_current_user(
    authorization: Optional[str] = Header(default=None),
    db: Session = Depends(get_db),
) -> User:
    """Resolve the signed-in user from the `Authorization: Bearer <jwt>` header."""
    if not authorization or not authorization.lower().startswith("bearer "):
        raise UnauthorizedError("Sign in to continue.")

    payload = decode_access_token(authorization.split(" ", 1)[1].strip())
    if not payload or "sub" not in payload:
        raise UnauthorizedError("Your session has expired. Sign in again.")

    user = UserRepository(db).get(int(payload["sub"]))
    if not user or not user.is_active:
        raise UnauthorizedError("This account is no longer active.")
    return user


def get_optional_user(
    authorization: Optional[str] = Header(default=None),
    db: Session = Depends(get_db),
) -> Optional[User]:
    """Same as above but never raises - used by endpoints that work signed out."""
    try:
        return get_current_user(authorization=authorization, db=db)
    except UnauthorizedError:
        return None


def pagination(
    page: int = Query(1, ge=1, description="1-based page number"),
    limit: int = Query(
        DEFAULT_LIMIT, ge=1, le=MAX_LIMIT, description=f"Items per page (max {MAX_LIMIT})"
    ),
) -> PageParams:
    return PageParams(page=page, limit=limit)
