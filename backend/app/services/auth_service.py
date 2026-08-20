"""Email + password sign-in issuing a JWT."""

from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.exceptions import UnauthorizedError
from app.core.security import create_access_token, verify_password
from app.repositories import UserRepository
from app.schemas.auth import LoginRequest, TokenResponse
from app.schemas.user import UserRead


class AuthService:
    def __init__(self, db: Session):
        self.users = UserRepository(db)

    def login(self, payload: LoginRequest) -> TokenResponse:
        user = self.users.get_by_email(payload.email)
        if not user or not verify_password(payload.password, user.hashed_password):
            raise UnauthorizedError("That email and password combination didn't match.")
        if not user.is_active:
            raise UnauthorizedError("This account has been deactivated.")

        token = create_access_token(user.id, {"email": user.email, "role": user.role.value})
        return TokenResponse(
            access_token=token,
            expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
            user=UserRead.model_validate(user, from_attributes=True),
        )
