"""Comments / notes on a task."""

from typing import List

from sqlalchemy.orm import Session

from app.core.exceptions import NotFoundError
from app.models.enums import ActivityAction
from app.repositories import ActivityRepository, CommentRepository, TaskRepository
from app.schemas.comment import CommentCreate, CommentRead


class CommentService:
    def __init__(self, db: Session):
        self.db = db
        self.comments = CommentRepository(db)
        self.tasks = TaskRepository(db)
        self.activities = ActivityRepository(db)

    def list_for_task(self, task_id: int) -> List[CommentRead]:
        if not self.tasks.get(task_id):
            raise NotFoundError(f"Task {task_id} does not exist.")
        return [
            CommentRead.model_validate(comment, from_attributes=True)
            for comment in self.comments.list_for_task(task_id)
        ]

    def add_comment(self, task_id: int, payload: CommentCreate, author_id: int) -> CommentRead:
        if not self.tasks.get(task_id):
            raise NotFoundError(f"Task {task_id} does not exist.")
        comment = self.comments.create(
            task_id=task_id, user_id=author_id, comment=payload.comment.strip()
        )
        self.activities.log(task_id, ActivityAction.COMMENTED, author_id)
        self.db.commit()
        self.db.refresh(comment)
        return CommentRead.model_validate(comment, from_attributes=True)

    def delete_comment(self, task_id: int, comment_id: int) -> None:
        comment = self.comments.get(comment_id)
        if not comment or comment.task_id != task_id:
            raise NotFoundError(f"Comment {comment_id} does not exist on task {task_id}.")
        self.comments.delete(comment)
        self.db.commit()
