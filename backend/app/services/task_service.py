"""Business rules for tasks.

Routes stay thin: they parse/validate input and hand it to this service, which
owns the rules (assignee must exist, completing a task stamps `completed_at`,
every change is written to the activity trail).
"""

import csv
import io
from typing import List, Optional, Sequence

from sqlalchemy.orm import Session

from app.core.exceptions import NotFoundError, ValidationError
from app.models import Task, User
from app.models.enums import (
    PRIORITY_LABELS,
    STATUS_LABELS,
    ActivityAction,
    TaskPriority,
    TaskStatus,
)
from app.repositories import (
    ActivityRepository,
    CommentRepository,
    TaskFilters,
    TaskRepository,
    UserRepository,
)
from app.schemas.common import Page
from app.schemas.task import TaskCreate, TaskDetail, TaskRead, TaskUpdate
from app.utils.datetime_utils import ensure_utc, utcnow
from app.utils.pagination import MAX_LIMIT, PageParams, build_page

TRACKED_FIELDS = ("title", "description", "status", "priority", "assigned_to", "due_date")

# A CSV export is a report, not a bulk data dump - cap it so one click cannot
# pull the whole table into memory.
EXPORT_LIMIT = 1000


class TaskService:
    def __init__(self, db: Session):
        self.db = db
        self.tasks = TaskRepository(db)
        self.users = UserRepository(db)
        self.comments = CommentRepository(db)
        self.activities = ActivityRepository(db)

    # ------------------------------------------------------------- internals
    def _require_task(self, task_id: int) -> Task:
        task = self.tasks.get(task_id)
        if not task:
            raise NotFoundError(f"Task {task_id} does not exist.")
        return task

    def _require_user(self, user_id: int) -> User:
        user = self.users.get(user_id)
        if not user:
            raise ValidationError(
                f"User {user_id} does not exist, so the task cannot be assigned to them."
            )
        if not user.is_active:
            raise ValidationError(f"{user.name} is deactivated and cannot take new work.")
        return user

    def _to_read(self, tasks: Sequence[Task]) -> List[TaskRead]:
        counts = self.tasks.comment_counts([task.id for task in tasks])
        items: List[TaskRead] = []
        for task in tasks:
            model = TaskRead.model_validate(task)
            model.comment_count = counts.get(task.id, 0)
            model.due_date = ensure_utc(model.due_date)
            items.append(model)
        return items

    # ----------------------------------------------------------------- reads
    def list_tasks(
        self,
        params: PageParams,
        filters: TaskFilters,
        sort_by: str = "created_at",
        sort_dir: str = "desc",
    ) -> Page:
        rows, total = self.tasks.search(params, filters, sort_by, sort_dir)
        return build_page(self._to_read(rows), total, params)

    def get_task(self, task_id: int) -> TaskDetail:
        task = self.tasks.get_with_relations(task_id)
        if not task:
            raise NotFoundError(f"Task {task_id} does not exist.")
        detail = TaskDetail.model_validate(task)
        detail.comments = [
            comment for comment in detail.comments
        ]
        detail.comment_count = len(detail.comments)
        detail.due_date = ensure_utc(detail.due_date)
        return detail

    # ---------------------------------------------------------------- writes
    def create_task(self, payload: TaskCreate, actor_id: Optional[int]) -> TaskDetail:
        if payload.assigned_to is not None:
            self._require_user(payload.assigned_to)

        values = payload.model_dump()
        values["created_by"] = actor_id
        if values.get("status") == TaskStatus.COMPLETED:
            values["completed_at"] = utcnow()

        task = self.tasks.create(**values)
        self.activities.log(task.id, ActivityAction.CREATED, actor_id, new_value=task.title)
        if task.assigned_to:
            assignee = self.users.get(task.assigned_to)
            self.activities.log(
                task.id,
                ActivityAction.ASSIGNED,
                actor_id,
                field="assigned_to",
                new_value=assignee.name if assignee else str(task.assigned_to),
            )
        self.db.commit()
        return self.get_task(task.id)

    def update_task(
        self, task_id: int, payload: TaskUpdate, actor_id: Optional[int]
    ) -> TaskDetail:
        task = self._require_task(task_id)
        changes = payload.model_dump(exclude_unset=True)

        if "assigned_to" in changes and changes["assigned_to"] is not None:
            self._require_user(changes["assigned_to"])

        for field in TRACKED_FIELDS:
            if field not in changes:
                continue
            old_value = getattr(task, field)
            new_value = changes[field]
            if old_value == new_value:
                continue

            action = {
                "status": ActivityAction.STATUS_CHANGED,
                "priority": ActivityAction.PRIORITY_CHANGED,
                "assigned_to": ActivityAction.ASSIGNED,
            }.get(field, ActivityAction.UPDATED)

            self.activities.log(
                task.id,
                action,
                actor_id,
                field=field,
                old_value=self._label(field, old_value),
                new_value=self._label(field, new_value),
            )

        if "status" in changes:
            if changes["status"] == TaskStatus.COMPLETED and task.status != TaskStatus.COMPLETED:
                changes["completed_at"] = utcnow()
            elif changes["status"] != TaskStatus.COMPLETED:
                changes["completed_at"] = None

        self.tasks.update(task, changes)
        self.db.commit()
        return self.get_task(task.id)

    def delete_task(self, task_id: int) -> None:
        task = self._require_task(task_id)
        self.tasks.delete(task)
        self.db.commit()

    def export_csv(self, filters: TaskFilters, sort_by: str, sort_dir: str) -> str:
        """The current view as CSV, so a filtered list can leave the tool.

        Reuses the same filter object as `list_tasks`, so whatever is on screen
        is exactly what lands in the file.
        """
        params = PageParams(page=1, limit=MAX_LIMIT)
        rows: List[Task] = []
        while len(rows) < EXPORT_LIMIT:
            batch, _ = self.tasks.search(params, filters, sort_by, sort_dir)
            if not batch:
                break
            rows.extend(batch)
            if len(batch) < params.limit:
                break
            params = PageParams(page=params.page + 1, limit=MAX_LIMIT)
        rows = rows[:EXPORT_LIMIT]

        buffer = io.StringIO()
        writer = csv.writer(buffer)
        writer.writerow(
            [
                "Reference",
                "Title",
                "Status",
                "Priority",
                "Assignee",
                "Due date",
                "Created",
                "Last updated",
                "Description",
            ]
        )
        for task in rows:
            writer.writerow(
                [
                    f"TSK-{task.id:04d}",
                    task.title,
                    STATUS_LABELS.get(task.status, task.status),
                    PRIORITY_LABELS.get(task.priority, task.priority),
                    task.assignee.name if task.assignee else "Unassigned",
                    task.due_date.strftime("%Y-%m-%d") if task.due_date else "",
                    task.created_at.strftime("%Y-%m-%d") if task.created_at else "",
                    task.updated_at.strftime("%Y-%m-%d") if task.updated_at else "",
                    (task.description or "").replace("\n", " ").strip(),
                ]
            )
        return buffer.getvalue()

    # --------------------------------------------------------------- helpers
    def _label(self, field: str, value) -> Optional[str]:
        """Render a value the way the activity feed should read it.

        The trail is read by people, not machines, so it stores display text:
        "In progress", not the `in_progress` enum member.
        """
        if value is None:
            return "nobody" if field == "assigned_to" else None
        if field == "assigned_to":
            user = self.users.get(int(value))
            return user.name if user else f"user {value}"
        if field == "description":
            text = str(value)
            return (text[:80] + "...") if len(text) > 80 else text
        if isinstance(value, (TaskStatus, TaskPriority)):
            return STATUS_LABELS.get(value) or PRIORITY_LABELS.get(value) or value.value
        if hasattr(value, "value"):
            return str(value.value)
        if field == "due_date" and hasattr(value, "strftime"):
            return value.strftime("%d %b %Y")
        if hasattr(value, "isoformat"):
            return value.isoformat()
        return str(value)
