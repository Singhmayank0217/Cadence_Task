"""Team member management."""

from typing import List, Optional

from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.exceptions import ConflictError, NotFoundError
from app.core.security import hash_password
from app.repositories import UserRepository
from app.schemas.common import Page
from app.schemas.user import UserCreate, UserRead, UserUpdate, UserWithStats
from app.utils.pagination import PageParams, build_page


class UserService:
    def __init__(self, db: Session):
        self.db = db
        self.users = UserRepository(db)

    def list_users(
        self,
        params: PageParams,
        search: Optional[str] = None,
        role: Optional[str] = None,
        with_stats: bool = True,
    ) -> Page:
        rows, total = self.users.search(params, search=search, role=role)
        counts = self.users.task_counts() if with_stats else {}
        items: List[UserWithStats] = []
        for user in rows:
            model = UserWithStats.model_validate(user, from_attributes=True)
            stats = counts.get(user.id, {})
            model.open_tasks = stats.get("open", 0)
            model.completed_tasks = stats.get("completed", 0)
            model.overdue_tasks = stats.get("overdue", 0)
            items.append(model)
        return build_page(items, total, params)

    def get_user(self, user_id: int) -> UserRead:
        user = self.users.get(user_id)
        if not user:
            raise NotFoundError(f"User {user_id} does not exist.")
        return UserRead.model_validate(user, from_attributes=True)

    def create_user(self, payload: UserCreate) -> UserRead:
        if self.users.get_by_email(payload.email):
            raise ConflictError(f"{payload.email} is already on the team.")
        values = payload.model_dump(exclude={"password"})
        values["hashed_password"] = hash_password(
            payload.password or settings.DEFAULT_PASSWORD
        )
        user = self.users.create(**values)
        self.db.commit()
        return UserRead.model_validate(user, from_attributes=True)

    def update_user(self, user_id: int, payload: UserUpdate) -> UserRead:
        user = self.users.get(user_id)
        if not user:
            raise NotFoundError(f"User {user_id} does not exist.")
        changes = payload.model_dump(exclude_unset=True)
        if "email" in changes:
            existing = self.users.get_by_email(changes["email"])
            if existing and existing.id != user_id:
                raise ConflictError(f"{changes['email']} is already on the team.")
        user = self.users.update(user, changes)
        self.db.commit()
        return UserRead.model_validate(user, from_attributes=True)

    def delete_user(self, user_id: int) -> None:
        user = self.users.get(user_id)
        if not user:
            raise NotFoundError(f"User {user_id} does not exist.")
        self.users.delete(user)
        self.db.commit()
