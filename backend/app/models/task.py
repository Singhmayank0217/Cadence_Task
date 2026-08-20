from datetime import datetime
from typing import List, Optional

from sqlalchemy import DateTime, Enum as SAEnum, ForeignKey, Index, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.models.base import TimestampMixin
from app.models.enums import TaskPriority, TaskStatus


class Task(Base, TimestampMixin):
    __tablename__ = "tasks"
    __table_args__ = (
        Index("ix_tasks_status_priority", "status", "priority"),
        Index("ix_tasks_assigned_due", "assigned_to", "due_date"),
    )

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    title: Mapped[str] = mapped_column(String(200), nullable=False, index=True)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    status: Mapped[TaskStatus] = mapped_column(
        SAEnum(TaskStatus, native_enum=False, length=20),
        default=TaskStatus.PENDING,
        nullable=False,
        index=True,
    )
    priority: Mapped[TaskPriority] = mapped_column(
        SAEnum(TaskPriority, native_enum=False, length=20),
        default=TaskPriority.MEDIUM,
        nullable=False,
        index=True,
    )
    # SET NULL keeps history intact if a team member is removed.
    assigned_to: Mapped[Optional[int]] = mapped_column(
        ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True
    )
    created_by: Mapped[Optional[int]] = mapped_column(
        ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )
    due_date: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), nullable=True, index=True
    )
    completed_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), nullable=True
    )

    assignee: Mapped[Optional["User"]] = relationship(
        back_populates="tasks", foreign_keys=[assigned_to], lazy="joined"
    )
    creator: Mapped[Optional["User"]] = relationship(
        foreign_keys=[created_by], lazy="joined"
    )
    comments: Mapped[List["Comment"]] = relationship(
        back_populates="task",
        cascade="all, delete-orphan",
        order_by="Comment.created_at.desc()",
    )
    activities: Mapped[List["Activity"]] = relationship(
        back_populates="task",
        cascade="all, delete-orphan",
        order_by="Activity.created_at.desc()",
    )

    @property
    def reference(self) -> str:
        """Human friendly ID shown in the UI, e.g. TSK-0042."""
        return f"TSK-{self.id:04d}"

    def __repr__(self) -> str:  # pragma: no cover
        return f"<Task {self.id} {self.title!r} {self.status}>"
