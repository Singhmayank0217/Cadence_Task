from datetime import datetime
from typing import Dict, List, Optional

from pydantic import BaseModel

from app.schemas.task import TaskRead


class StatusBreakdown(BaseModel):
    pending: int = 0
    in_progress: int = 0
    completed: int = 0
    blocked: int = 0


class PriorityBreakdown(BaseModel):
    low: int = 0
    medium: int = 0
    high: int = 0
    urgent: int = 0


class DashboardStats(BaseModel):
    total_tasks: int
    pending_tasks: int
    in_progress_tasks: int
    completed_tasks: int
    blocked_tasks: int
    overdue_tasks: int
    due_today: int
    due_this_week: int
    my_tasks: int
    my_open_tasks: int
    my_overdue_tasks: int
    completion_rate: float


class WorkloadRow(BaseModel):
    user_id: int
    name: str
    avatar_url: Optional[str] = None
    job_title: Optional[str] = None
    pending: int = 0
    in_progress: int = 0
    blocked: int = 0
    completed: int = 0
    overdue: int = 0
    total: int = 0


class DueBucket(BaseModel):
    date: str                          # ISO date, e.g. "2026-08-18"
    label: str                         # "Mon 18"
    count: int
    # {"urgent": 2, "high": 1, ...} so the strip can colour each tick.
    priorities: Dict[str, int] = {}
    overdue: bool = False


class DashboardResponse(BaseModel):
    generated_at: datetime
    stats: DashboardStats
    status_breakdown: StatusBreakdown
    priority_breakdown: PriorityBreakdown
    workload: List[WorkloadRow]
    due_timeline: List[DueBucket]
    my_focus: List[TaskRead]
    recently_updated: List[TaskRead]
