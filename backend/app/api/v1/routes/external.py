"""Third-party directory integration endpoints."""

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.core.database import get_db
from app.models import User
from app.schemas.external import ExternalUsersResponse, ImportExternalUserRequest
from app.schemas.user import UserRead
from app.services import ExternalApiService

router = APIRouter(prefix="/external", tags=["External API"])


@router.get(
    "/users",
    response_model=ExternalUsersResponse,
    summary="Fetch contacts from the partner directory",
    description=(
        "Calls a public REST API with a timeout, bounded retries, an outbound "
        "rate limit and a short-lived cache. Pass `?refresh=true` to bypass the cache."
    ),
)
def external_users(
    refresh: bool = Query(False, description="Skip the cache and re-fetch"),
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    return ExternalApiService(db).fetch_users(refresh=refresh)


@router.get("/status", summary="Integration health")
def external_status(_: User = Depends(get_current_user)):
    return ExternalApiService.cache_status()


@router.post(
    "/users/import",
    response_model=UserRead,
    status_code=status.HTTP_201_CREATED,
    summary="Import a directory contact as a team member",
)
def import_external_user(
    payload: ImportExternalUserRequest,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    return ExternalApiService(db).import_user(payload.external_id)
