from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict

from app.models.enums import ActivityAction
from app.schemas.common import UTCDateTime
from app.schemas.user import UserSummary


class ActivityRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    task_id: int
    action: ActivityAction
    field: Optional[str] = None
    old_value: Optional[str] = None
    new_value: Optional[str] = None
    created_at: UTCDateTime
    actor: Optional[UserSummary] = None
