"""Task queries.

Every filter, search, sort and page is applied in SQL - the API never loads the
whole table into memory to slice it in Python.
"""

from datetime import datetime
from typing import Dict, List, Optional, Sequence, Tuple

from sqlalchemy import Select, and_, case, func, or_, select
from sqlalchemy.orm import Session, selectinload

from app.models import Comment, Task, User
from app.models.enums import PRIORITY_WEIGHT, STATUS_WEIGHT, TaskPriority, TaskStatus
from app.repositories.base import BaseRepository
from app.utils.datetime_utils import utcnow
from app.utils.pagination import PageParams

SORTABLE_FIELDS = {
    "created_at": Task.created_at,
    "updated_at": Task.updated_at,
    "due_date": Task.due_date,
    "title": Task.title,
    "status": Task.status,
    "priority": Task.priority,
    "id": Task.id,
}


def _weighted(column, weights: Dict) -> case:
    """Order enum columns by real-world importance instead of alphabetically."""
    return case(
        *[(column == member, weight) for member, weight in weights.items()],
        else_=0,
    )


class TaskFilters:
    """Value object holding every supported query parameter."""

    def __init__(
        self,
        search: Optional[str] = None,
        status: Optional[List[TaskStatus]] = None,
        priority: Optional[List[TaskPriority]] = None,
        assignee: Optional[int] = None,
        unassigned: bool = False,
        created_by: Optional[int] = None,
        overdue: Optional[bool] = None,
        due_before: Optional[datetime] = None,
        due_after: Optional[datetime] = None,
    ):
        self.search = search
        self.status = status or []
        self.priority = priority or []
        self.assignee = assignee
        self.unassigned = unassigned
        self.created_by = created_by
        self.overdue = overdue
        self.due_before = due_before
        self.due_after = due_after


class TaskRepository(BaseRepository[Task]):
    def __init__(self, db: Session):
        super().__init__(Task, db)

    # ------------------------------------------------------------------ reads
    def get_with_relations(self, task_id: int) -> Optional[Task]:
        stmt = (
            select(Task)
            .options(
                selectinload(Task.comments).joinedload(Comment.author),
                selectinload(Task.activities),
            )
            .where(Task.id == task_id)
        )
        return self.db.execute(stmt).unique().scalars().first()

    def _apply_filters(self, stmt: Select, filters: TaskFilters) -> Select:
        if filters.search:
            term = f"%{filters.search.lower()}%"
            stmt = stmt.where(
                or_(
                    func.lower(Task.title).like(term),
                    func.lower(func.coalesce(Task.description, "")).like(term),
                )
            )
        if filters.status:
            stmt = stmt.where(Task.status.in_(filters.status))
        if filters.priority:
            stmt = stmt.where(Task.priority.in_(filters.priority))
        if filters.unassigned:
            stmt = stmt.where(Task.assigned_to.is_(None))
        elif filters.assignee is not None:
            stmt = stmt.where(Task.assigned_to == filters.assignee)
        if filters.created_by is not None:
            stmt = stmt.where(Task.created_by == filters.created_by)
        if filters.overdue is True:
            stmt = stmt.where(
                and_(
                    Task.due_date.is_not(None),
                    Task.due_date < utcnow(),
                    Task.status != TaskStatus.COMPLETED,
                )
            )
        elif filters.overdue is False:
            stmt = stmt.where(
                or_(
                    Task.due_date.is_(None),
                    Task.due_date >= utcnow(),
                    Task.status == TaskStatus.COMPLETED,
                )
            )
        if filters.due_before:
            stmt = stmt.where(Task.due_date <= filters.due_before)
        if filters.due_after:
            stmt = stmt.where(Task.due_date >= filters.due_after)
        return stmt

    def search(
        self,
        params: PageParams,
        filters: TaskFilters,
        sort_by: str = "created_at",
        sort_dir: str = "desc",
    ) -> Tuple[Sequence[Task], int]:
        stmt = select(Task)
        stmt = self._apply_filters(stmt, filters)

        total = self.db.execute(
            select(func.count()).select_from(stmt.with_only_columns(Task.id).subquery())
        ).scalar_one()

        if sort_by == "priority":
            order_column = _weighted(Task.priority, PRIORITY_WEIGHT)
        elif sort_by == "status":
            order_column = _weighted(Task.status, STATUS_WEIGHT)
        else:
            order_column = SORTABLE_FIELDS.get(sort_by, Task.created_at)

        direction = order_column.desc() if sort_dir == "desc" else order_column.asc()
        # Tasks without a due date always sort last, whichever direction is used.
        if sort_by == "due_date":
            stmt = stmt.order_by(Task.due_date.is_(None).asc(), direction, Task.id.desc())
        else:
            stmt = stmt.order_by(direction, Task.id.desc())

        stmt = stmt.limit(params.limit).offset(params.offset)
        rows = self.db.execute(stmt).unique().scalars().all()
        return rows, total

    # ----------------------------------------------------------- aggregations
    def count_by_status(self, assignee: Optional[int] = None) -> Dict[str, int]:
        stmt = select(Task.status, func.count(Task.id)).group_by(Task.status)
        if assignee is not None:
            stmt = stmt.where(Task.assigned_to == assignee)
        counts = {status.value: 0 for status in TaskStatus}
        for status, total in self.db.execute(stmt).all():
            key = status.value if isinstance(status, TaskStatus) else str(status)
            counts[key] = int(total)
        return counts

    def count_by_priority(self) -> Dict[str, int]:
        stmt = select(Task.priority, func.count(Task.id)).group_by(Task.priority)
        counts = {priority.value: 0 for priority in TaskPriority}
        for priority, total in self.db.execute(stmt).all():
            key = priority.value if isinstance(priority, TaskPriority) else str(priority)
            counts[key] = int(total)
        return counts

    def count_overdue(self, assignee: Optional[int] = None) -> int:
        stmt = select(func.count(Task.id)).where(
            Task.due_date.is_not(None),
            Task.due_date < utcnow(),
            Task.status != TaskStatus.COMPLETED,
        )
        if assignee is not None:
            stmt = stmt.where(Task.assigned_to == assignee)
        return int(self.db.execute(stmt).scalar_one())

    def count_due_between(
        self, start: datetime, end: datetime, exclude_completed: bool = True
    ) -> int:
        stmt = select(func.count(Task.id)).where(
            Task.due_date.is_not(None), Task.due_date >= start, Task.due_date <= end
        )
        if exclude_completed:
            stmt = stmt.where(Task.status != TaskStatus.COMPLETED)
        return int(self.db.execute(stmt).scalar_one())

    def count_for_user(self, user_id: int, open_only: bool = False) -> int:
        stmt = select(func.count(Task.id)).where(Task.assigned_to == user_id)
        if open_only:
            stmt = stmt.where(Task.status != TaskStatus.COMPLETED)
        return int(self.db.execute(stmt).scalar_one())

    def workload(self) -> List[dict]:
        """Per-assignee status split, resolved in a single grouped query."""
        now = utcnow()
        stmt = (
            select(
                User.id,
                User.name,
                User.avatar_url,
                User.job_title,
                func.sum(case((Task.status == TaskStatus.PENDING, 1), else_=0)),
                func.sum(case((Task.status == TaskStatus.IN_PROGRESS, 1), else_=0)),
                func.sum(case((Task.status == TaskStatus.BLOCKED, 1), else_=0)),
                func.sum(case((Task.status == TaskStatus.COMPLETED, 1), else_=0)),
                func.sum(
                    case(
                        (
                            and_(
                                Task.due_date.is_not(None),
                                Task.due_date < now,
                                Task.status != TaskStatus.COMPLETED,
                            ),
                            1,
                        ),
                        else_=0,
                    )
                ),
                func.count(Task.id),
            )
            .select_from(User)
            .join(Task, Task.assigned_to == User.id, isouter=True)
            .where(User.is_active.is_(True))
            .group_by(User.id, User.name, User.avatar_url, User.job_title)
            .order_by(func.count(Task.id).desc(), User.name.asc())
        )
        rows = []
        for (
            user_id,
            name,
            avatar_url,
            job_title,
            pending,
            in_progress,
            blocked,
            completed,
            overdue,
            total,
        ) in self.db.execute(stmt).all():
            rows.append(
                {
                    "user_id": user_id,
                    "name": name,
                    "avatar_url": avatar_url,
                    "job_title": job_title,
                    "pending": int(pending or 0),
                    "in_progress": int(in_progress or 0),
                    "blocked": int(blocked or 0),
                    "completed": int(completed or 0),
                    "overdue": int(overdue or 0),
                    "total": int(total or 0),
                }
            )
        return rows

    def due_between_grouped(self, start: datetime, end: datetime) -> Dict[str, int]:
        """Counts of open tasks per due-date day, for the timeline strip."""
        stmt = (
            select(func.date(Task.due_date), func.count(Task.id))
            .where(
                Task.due_date.is_not(None),
                Task.due_date >= start,
                Task.due_date <= end,
                Task.status != TaskStatus.COMPLETED,
            )
            .group_by(func.date(Task.due_date))
        )
        result: Dict[str, int] = {}
        for day, total in self.db.execute(stmt).all():
            result[str(day)[:10]] = int(total)
        return result

    def due_between_grouped_by_priority(
        self, start: datetime, end: datetime
    ) -> Dict[str, Dict[str, int]]:
        """Per-day, per-priority counts so the strip can colour each tick.

        One grouped query rather than a query per day, and it covers every task
        in range - not just the handful the dashboard happens to return.
        """
        stmt = (
            select(func.date(Task.due_date), Task.priority, func.count(Task.id))
            .where(
                Task.due_date.is_not(None),
                Task.due_date >= start,
                Task.due_date <= end,
                Task.status != TaskStatus.COMPLETED,
            )
            .group_by(func.date(Task.due_date), Task.priority)
        )
        result: Dict[str, Dict[str, int]] = {}
        for day, priority, total in self.db.execute(stmt).all():
            key = str(day)[:10]
            name = priority.value if isinstance(priority, TaskPriority) else str(priority)
            result.setdefault(key, {})[name] = int(total)
        return result

    def recently_updated(self, limit: int = 6) -> Sequence[Task]:
        stmt = select(Task).order_by(Task.updated_at.desc()).limit(limit)
        return self.db.execute(stmt).unique().scalars().all()

    def focus_for_user(self, user_id: int, limit: int = 6) -> Sequence[Task]:
        """The assignee's most urgent open work: overdue first, then by due date."""
        stmt = (
            select(Task)
            .where(Task.assigned_to == user_id, Task.status != TaskStatus.COMPLETED)
            .order_by(
                Task.due_date.is_(None).asc(),
                Task.due_date.asc(),
                _weighted(Task.priority, PRIORITY_WEIGHT).desc(),
            )
            .limit(limit)
        )
        return self.db.execute(stmt).unique().scalars().all()

    def comment_counts(self, task_ids: List[int]) -> Dict[int, int]:
        if not task_ids:
            return {}
        stmt = (
            select(Comment.task_id, func.count(Comment.id))
            .where(Comment.task_id.in_(task_ids))
            .group_by(Comment.task_id)
        )
        return {task_id: int(total) for task_id, total in self.db.execute(stmt).all()}
