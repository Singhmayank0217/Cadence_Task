from typing import Dict, List, Optional, Sequence, Tuple

from sqlalchemy import case, func, or_, select
from sqlalchemy.orm import Session

from app.models import Task, User
from app.models.enums import TaskStatus
from app.repositories.base import BaseRepository
from app.utils.datetime_utils import utcnow
from app.utils.pagination import PageParams


class UserRepository(BaseRepository[User]):
    def __init__(self, db: Session):
        super().__init__(User, db)

    def get_by_email(self, email: str) -> Optional[User]:
        stmt = select(User).where(func.lower(User.email) == email.lower())
        return self.db.execute(stmt).scalars().first()

    def search(
        self,
        params: PageParams,
        search: Optional[str] = None,
        role: Optional[str] = None,
        include_inactive: bool = True,
    ) -> Tuple[Sequence[User], int]:
        stmt = select(User)
        if search:
            term = f"%{search.lower()}%"
            stmt = stmt.where(
                or_(
                    func.lower(User.name).like(term),
                    func.lower(User.email).like(term),
                    func.lower(func.coalesce(User.job_title, "")).like(term),
                )
            )
        if role:
            stmt = stmt.where(User.role == role)
        if not include_inactive:
            stmt = stmt.where(User.is_active.is_(True))

        total = self.db.execute(
            select(func.count()).select_from(stmt.subquery())
        ).scalar_one()
        stmt = stmt.order_by(User.name.asc()).limit(params.limit).offset(params.offset)
        return self.db.execute(stmt).scalars().all(), total

    def task_counts(self) -> Dict[int, Dict[str, int]]:
        """One grouped query for every user's open/completed/overdue totals."""
        now = utcnow()
        stmt = (
            select(
                Task.assigned_to,
                func.count(Task.id),
                func.sum(case((Task.status == TaskStatus.COMPLETED, 1), else_=0)),
                func.sum(
                    case(
                        (
                            (Task.due_date.is_not(None))
                            & (Task.due_date < now)
                            & (Task.status != TaskStatus.COMPLETED),
                            1,
                        ),
                        else_=0,
                    )
                ),
            )
            .where(Task.assigned_to.is_not(None))
            .group_by(Task.assigned_to)
        )
        result: Dict[int, Dict[str, int]] = {}
        for user_id, total, completed, overdue in self.db.execute(stmt).all():
            completed = int(completed or 0)
            result[user_id] = {
                "total": int(total or 0),
                "completed": completed,
                "open": int(total or 0) - completed,
                "overdue": int(overdue or 0),
            }
        return result

    def all_active(self) -> List[User]:
        stmt = select(User).where(User.is_active.is_(True)).order_by(User.name.asc())
        return list(self.db.execute(stmt).scalars().all())
