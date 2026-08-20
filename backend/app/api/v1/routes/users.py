"""Team member endpoints."""

from typing import Optional

from fastapi import APIRouter, Depends, Path, Query, Response, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, pagination
from app.core.database import get_db
from app.models import User
from app.schemas.common import Page
from app.schemas.user import UserCreate, UserRead, UserUpdate, UserWithStats
from app.services import UserService
from app.utils.pagination import PageParams

router = APIRouter(prefix="/users", tags=["Users"])


@router.get("", response_model=Page[UserWithStats], summary="List team members")
def list_users(
    params: PageParams = Depends(pagination),
    search: Optional[str] = Query(None, max_length=120),
    role: Optional[str] = Query(None, pattern="^(admin|manager|member)$"),
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    return UserService(db).list_users(params, search=search, role=role)


@router.post(
    "", response_model=UserRead, status_code=status.HTTP_201_CREATED, summary="Add a member"
)
def create_user(
    payload: UserCreate,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    return UserService(db).create_user(payload)


@router.get("/me", response_model=UserRead, summary="Current signed-in user")
def read_me(current_user: User = Depends(get_current_user)):
    return UserRead.model_validate(current_user, from_attributes=True)


@router.get("/{user_id}", response_model=UserRead, summary="Get one member")
def get_user(
    user_id: int = Path(..., ge=1),
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    return UserService(db).get_user(user_id)


@router.put("/{user_id}", response_model=UserRead, summary="Update a member")
def update_user(
    payload: UserUpdate,
    user_id: int = Path(..., ge=1),
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    return UserService(db).update_user(user_id, payload)


@router.delete(
    "/{user_id}", status_code=status.HTTP_204_NO_CONTENT, summary="Remove a member"
)
def delete_user(
    user_id: int = Path(..., ge=1),
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    UserService(db).delete_user(user_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)
