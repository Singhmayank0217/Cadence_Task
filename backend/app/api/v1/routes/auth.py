"""Authentication endpoints."""

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.core.database import get_db
from app.models import User
from app.schemas.auth import LoginRequest, TokenResponse
from app.schemas.user import UserRead
from app.services import AuthService

router = APIRouter(prefix="/auth", tags=["Auth"])


@router.post("/login", response_model=TokenResponse, summary="Sign in")
def login(payload: LoginRequest, db: Session = Depends(get_db)):
    return AuthService(db).login(payload)


@router.get("/me", response_model=UserRead, summary="Who am I")
def me(current_user: User = Depends(get_current_user)):
    return UserRead.model_validate(current_user, from_attributes=True)
