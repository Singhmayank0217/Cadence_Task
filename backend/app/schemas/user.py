from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, EmailStr, Field

from app.models.enums import UserRole
from app.schemas.common import UTCDateTime


class UserBase(BaseModel):
    name: str = Field(..., min_length=2, max_length=120, examples=["Janvi Sharma"])
    email: EmailStr
    role: UserRole = UserRole.MEMBER
    job_title: Optional[str] = Field(default=None, max_length=120)
    avatar_url: Optional[str] = Field(default=None, max_length=500)


class UserCreate(UserBase):
    password: Optional[str] = Field(
        default=None,
        min_length=6,
        max_length=128,
        description="Optional. Falls back to the configured default password.",
    )


class UserUpdate(BaseModel):
    name: Optional[str] = Field(default=None, min_length=2, max_length=120)
    email: Optional[EmailStr] = None
    role: Optional[UserRole] = None
    job_title: Optional[str] = Field(default=None, max_length=120)
    avatar_url: Optional[str] = Field(default=None, max_length=500)
    is_active: Optional[bool] = None


class UserSummary(BaseModel):
    """Compact shape embedded inside tasks, comments and activity items."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    email: EmailStr
    avatar_url: Optional[str] = None
    role: UserRole


class UserRead(UserSummary):
    job_title: Optional[str] = None
    is_active: bool = True
    source: str = "internal"
    created_at: UTCDateTime


class UserWithStats(UserRead):
    open_tasks: int = 0
    completed_tasks: int = 0
    overdue_tasks: int = 0
