from datetime import datetime
from typing import Optional

from sqlalchemy import DateTime, Enum as SAEnum, ForeignKey, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.models.enums import ActivityAction


class Activity(Base):
    """Append-only audit trail rendered as the task history feed."""

    __tablename__ = "activities"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    task_id: Mapped[int] = mapped_column(
        ForeignKey("tasks.id", ondelete="CASCADE"), nullable=False, index=True
    )
    user_id: Mapped[Optional[int]] = mapped_column(
        ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )
    action: Mapped[ActivityAction] = mapped_column(
        SAEnum(ActivityAction, native_enum=False, length=30), nullable=False
    )
    field: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    old_value: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    new_value: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    task: Mapped["Task"] = relationship(back_populates="activities")
    actor: Mapped[Optional["User"]] = relationship(lazy="joined")
