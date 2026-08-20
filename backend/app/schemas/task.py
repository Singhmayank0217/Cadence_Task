from datetime import datetime, timezone
from typing import List, Optional

from pydantic import BaseModel, ConfigDict, Field, computed_field, field_validator

from app.models.enums import TaskPriority, TaskStatus
from app.schemas.activity import ActivityRead
from app.schemas.common import UTCDateTime
from app.schemas.comment import CommentRead
from app.schemas.user import UserSummary


class TaskBase(BaseModel):
    title: str = Field(..., min_length=3, max_length=200)
    description: Optional[str] = Field(default=None, max_length=8000)
    status: TaskStatus = TaskStatus.PENDING
    priority: TaskPriority = TaskPriority.MEDIUM
    assigned_to: Optional[int] = Field(
        default=None, ge=1, description="User id of the assignee"
    )
    due_date: Optional[datetime] = None

    @field_validator("title")
    @classmethod
    def _strip_title(cls, value: str) -> str:
        cleaned = value.strip()
        if len(cleaned) < 3:
            raise ValueError("Title must be at least 3 characters long.")
        return cleaned


class TaskCreate(TaskBase):
    pass


class TaskUpdate(BaseModel):
    """Every field optional - this powers PUT/PATCH from the detail page."""

    title: Optional[str] = Field(default=None, min_length=3, max_length=200)
    description: Optional[str] = Field(default=None, max_length=8000)
    status: Optional[TaskStatus] = None
    priority: Optional[TaskPriority] = None
    assigned_to: Optional[int] = Field(default=None, ge=1)
    due_date: Optional[datetime] = None

    model_config = ConfigDict(extra="forbid")


class TaskStatusUpdate(BaseModel):
    status: TaskStatus


class TaskRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    title: str
    description: Optional[str] = None
    status: TaskStatus
    priority: TaskPriority
    due_date: Optional[UTCDateTime] = None
    completed_at: Optional[UTCDateTime] = None
    created_at: UTCDateTime
    updated_at: UTCDateTime
    assignee: Optional[UserSummary] = None
    creator: Optional[UserSummary] = None
    comment_count: int = 0

    @computed_field
    @property
    def reference(self) -> str:
        return f"TSK-{self.id:04d}"

    @computed_field
    @property
    def is_overdue(self) -> bool:
        if not self.due_date or self.status == TaskStatus.COMPLETED:
            return False
        due = self.due_date
        if due.tzinfo is None:
            due = due.replace(tzinfo=timezone.utc)
        return due < datetime.now(timezone.utc)


class TaskDetail(TaskRead):
    comments: List[CommentRead] = []
    activities: List[ActivityRead] = []
