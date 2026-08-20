"""Everything the dashboard needs, assembled from grouped SQL queries."""

from datetime import timedelta

from sqlalchemy.orm import Session

from app.repositories import TaskRepository
from app.schemas.dashboard import (
    DashboardResponse,
    DashboardStats,
    DueBucket,
    PriorityBreakdown,
    StatusBreakdown,
    WorkloadRow,
)
from app.services.task_service import TaskService
from app.utils.datetime_utils import end_of_day, start_of_day, utcnow

TIMELINE_DAYS = 14


class DashboardService:
    def __init__(self, db: Session):
        self.db = db
        self.tasks = TaskRepository(db)
        self.task_service = TaskService(db)

    def build(self, current_user_id: int) -> DashboardResponse:
        by_status = self.tasks.count_by_status()
        by_priority = self.tasks.count_by_priority()
        total = sum(by_status.values())
        completed = by_status.get("completed", 0)

        now = utcnow()
        today_start, today_end = start_of_day(now), end_of_day(now)
        week_end = end_of_day(now + timedelta(days=7))

        my_total = self.tasks.count_for_user(current_user_id)
        my_open = self.tasks.count_for_user(current_user_id, open_only=True)

        stats = DashboardStats(
            total_tasks=total,
            pending_tasks=by_status.get("pending", 0),
            in_progress_tasks=by_status.get("in_progress", 0),
            completed_tasks=completed,
            blocked_tasks=by_status.get("blocked", 0),
            overdue_tasks=self.tasks.count_overdue(),
            due_today=self.tasks.count_due_between(today_start, today_end),
            due_this_week=self.tasks.count_due_between(today_start, week_end),
            my_tasks=my_total,
            my_open_tasks=my_open,
            my_overdue_tasks=self.tasks.count_overdue(assignee=current_user_id),
            completion_rate=round((completed / total) * 100, 1) if total else 0.0,
        )

        timeline_start = start_of_day(now)
        timeline_end = end_of_day(now + timedelta(days=TIMELINE_DAYS - 1))
        grouped = self.tasks.due_between_grouped(timeline_start, timeline_end)
        by_priority_per_day = self.tasks.due_between_grouped_by_priority(
            timeline_start, timeline_end
        )
        timeline = []
        for offset in range(TIMELINE_DAYS):
            day = (now + timedelta(days=offset)).date()
            timeline.append(
                DueBucket(
                    date=day.isoformat(),
                    label=day.strftime("%a %d"),
                    count=grouped.get(day.isoformat(), 0),
                    priorities=by_priority_per_day.get(day.isoformat(), {}),
                    overdue=False,
                )
            )

        return DashboardResponse(
            generated_at=now,
            stats=stats,
            status_breakdown=StatusBreakdown(**by_status),
            priority_breakdown=PriorityBreakdown(**by_priority),
            workload=[WorkloadRow(**row) for row in self.tasks.workload()],
            due_timeline=timeline,
            my_focus=self.task_service._to_read(
                self.tasks.focus_for_user(current_user_id, limit=5)
            ),
            recently_updated=self.task_service._to_read(
                self.tasks.recently_updated(limit=6)
            ),
        )
