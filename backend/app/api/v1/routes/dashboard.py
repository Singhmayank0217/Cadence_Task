"""Dashboard aggregation endpoint."""

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.core.database import get_db
from app.models import User
from app.schemas.dashboard import DashboardResponse
from app.services import DashboardService

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])


@router.get(
    "",
    response_model=DashboardResponse,
    summary="Team overview",
    description=(
        "Totals by status and priority, overdue counts, per-member workload, a "
        "14-day due-date timeline, and the signed-in user's own queue."
    ),
)
def get_dashboard(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return DashboardService(db).build(current_user.id)
