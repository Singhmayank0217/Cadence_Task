from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field

from app.schemas.common import UTCDateTime
from app.schemas.user import UserSummary


class CommentCreate(BaseModel):
    comment: str = Field(..., min_length=1, max_length=2000)


class CommentRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    task_id: int
    comment: str
    created_at: UTCDateTime
    author: UserSummary
