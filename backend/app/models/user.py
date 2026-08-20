from datetime import datetime
from typing import List, Optional

from sqlalchemy import DateTime, Enum as SAEnum, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.models.enums import UserRole


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(120), nullable=False)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    role: Mapped[UserRole] = mapped_column(
        SAEnum(UserRole, native_enum=False, length=20),
        default=UserRole.MEMBER,
        nullable=False,
    )
    job_title: Mapped[Optional[str]] = mapped_column(String(120), nullable=True)
    avatar_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    hashed_password: Mapped[str] = mapped_column(String(255), nullable=False)
    is_active: Mapped[bool] = mapped_column(default=True, nullable=False)
    source: Mapped[str] = mapped_column(String(30), default="internal", nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    # A user can own many tasks; deleting a user leaves their tasks unassigned.
    tasks: Mapped[List["Task"]] = relationship(
        back_populates="assignee", foreign_keys="Task.assigned_to"
    )
    comments: Mapped[List["Comment"]] = relationship(
        back_populates="author", cascade="all, delete-orphan"
    )

    def __repr__(self) -> str:  # pragma: no cover - debugging helper
        return f"<User {self.id} {self.email}>"
