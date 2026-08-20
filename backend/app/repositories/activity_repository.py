from typing import Optional, Sequence

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models import Activity
from app.models.enums import ActivityAction
from app.repositories.base import BaseRepository


class ActivityRepository(BaseRepository[Activity]):
    def __init__(self, db: Session):
        super().__init__(Activity, db)

    def log(
        self,
        task_id: int,
        action: ActivityAction,
        user_id: Optional[int] = None,
        field: Optional[str] = None,
        old_value: Optional[str] = None,
        new_value: Optional[str] = None,
    ) -> Activity:
        return self.create(
            task_id=task_id,
            action=action,
            user_id=user_id,
            field=field,
            old_value=str(old_value) if old_value is not None else None,
            new_value=str(new_value) if new_value is not None else None,
        )

    def list_for_task(self, task_id: int, limit: int = 50) -> Sequence[Activity]:
        stmt = (
            select(Activity)
            .where(Activity.task_id == task_id)
            .order_by(Activity.created_at.desc(), Activity.id.desc())
            .limit(limit)
        )
        return self.db.execute(stmt).unique().scalars().all()
