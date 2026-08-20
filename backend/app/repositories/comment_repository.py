from typing import Sequence

from sqlalchemy import select
from sqlalchemy.orm import Session, joinedload

from app.models import Comment
from app.repositories.base import BaseRepository


class CommentRepository(BaseRepository[Comment]):
    def __init__(self, db: Session):
        super().__init__(Comment, db)

    def list_for_task(self, task_id: int) -> Sequence[Comment]:
        stmt = (
            select(Comment)
            .options(joinedload(Comment.author))
            .where(Comment.task_id == task_id)
            .order_by(Comment.created_at.desc())
        )
        return self.db.execute(stmt).unique().scalars().all()
