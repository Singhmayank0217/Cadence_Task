"""Task endpoints.

    GET    /api/tasks            list + search + filter + sort + paginate
    GET    /api/tasks/export.csv the same view as a CSV download
    POST   /api/tasks            create
    GET    /api/tasks/{id}       detail (comments + activity)
    PUT    /api/tasks/{id}       full/partial update
    PATCH  /api/tasks/{id}/status quick status change
    DELETE /api/tasks/{id}       delete
    GET    /api/tasks/{id}/comments
    POST   /api/tasks/{id}/comments
"""

from datetime import datetime
from typing import List, Optional

from fastapi import APIRouter, Depends, Path, Query, Response, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, pagination
from app.core.database import get_db
from app.core.exceptions import ValidationError
from app.models import User
from app.models.enums import TaskPriority, TaskStatus
from app.repositories import TaskFilters
from app.repositories.task_repository import SORTABLE_FIELDS
from app.schemas.comment import CommentCreate, CommentRead
from app.schemas.common import Page
from app.schemas.task import (
    TaskCreate,
    TaskDetail,
    TaskRead,
    TaskStatusUpdate,
    TaskUpdate,
)
from app.services import CommentService, TaskService
from app.utils.pagination import PageParams

router = APIRouter(prefix="/tasks", tags=["Tasks"])


def _split(values: Optional[List[str]]) -> List[str]:
    """Accept both `?status=a&status=b` and `?status=a,b`."""
    if not values:
        return []
    out: List[str] = []
    for value in values:
        out.extend(part.strip() for part in value.split(",") if part.strip())
    return out


def _parse_enum(raw: List[str], enum_cls, label: str):
    parsed = []
    for value in raw:
        try:
            parsed.append(enum_cls(value.lower()))
        except ValueError:
            allowed = ", ".join(member.value for member in enum_cls)
            raise ValidationError(
                f"'{value}' is not a valid {label}. Use one of: {allowed}."
            )
    return parsed


def _resolve_assignee(assignee: Optional[str], current_user: User):
    """`?assignee=` accepts a user id, `me`, or `unassigned`."""
    if not assignee:
        return None, False
    token = assignee.strip().lower()
    if token in {"unassigned", "none", "null"}:
        return None, True
    if token == "me":
        return current_user.id, False
    if token.isdigit():
        return int(token), False
    raise ValidationError("`assignee` must be a user id, `me`, or `unassigned`.")


@router.get(
    "",
    response_model=Page[TaskRead],
    summary="List tasks",
    description=(
        "Filtering, searching, sorting and pagination all happen in the database. "
        "Examples: `?status=in_progress`, `?priority=high,urgent`, `?assignee=12`, "
        "`?assignee=me`, `?assignee=unassigned`, `?search=shopify`, `?overdue=true`, "
        "`?sort_by=due_date&sort_dir=asc`, `?page=1&limit=20`."
    ),
)
def list_tasks(
    params: PageParams = Depends(pagination),
    search: Optional[str] = Query(None, max_length=120, description="Matches title or description"),
    status_filter: Optional[List[str]] = Query(None, alias="status"),
    priority_filter: Optional[List[str]] = Query(None, alias="priority"),
    assignee: Optional[str] = Query(None, description="User id, `me`, or `unassigned`"),
    overdue: Optional[bool] = Query(None),
    due_before: Optional[datetime] = Query(None),
    due_after: Optional[datetime] = Query(None),
    sort_by: str = Query("created_at"),
    sort_dir: str = Query("desc", pattern="^(asc|desc)$"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if sort_by not in SORTABLE_FIELDS:
        raise ValidationError(
            f"Cannot sort by '{sort_by}'. Sortable fields: {', '.join(SORTABLE_FIELDS)}."
        )

    assignee_id, unassigned = _resolve_assignee(assignee, current_user)

    filters = TaskFilters(
        search=search.strip() if search else None,
        status=_parse_enum(_split(status_filter), TaskStatus, "status"),
        priority=_parse_enum(_split(priority_filter), TaskPriority, "priority"),
        assignee=assignee_id,
        unassigned=unassigned,
        overdue=overdue,
        due_before=due_before,
        due_after=due_after,
    )
    return TaskService(db).list_tasks(params, filters, sort_by, sort_dir)


@router.post(
    "",
    response_model=TaskDetail,
    status_code=status.HTTP_201_CREATED,
    summary="Create a task",
)
def create_task(
    payload: TaskCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return TaskService(db).create_task(payload, current_user.id)


@router.get(
    "/export.csv",
    summary="Export the current view as CSV",
    response_class=Response,
    responses={200: {"content": {"text/csv": {}}, "description": "A CSV file"}},
    description=(
        "Takes the same filter, search and sort parameters as `GET /api/tasks` and "
        "returns them as a CSV attachment, capped at 1000 rows."
    ),
)
def export_tasks(
    search: Optional[str] = Query(None, max_length=120),
    status_filter: Optional[List[str]] = Query(None, alias="status"),
    priority_filter: Optional[List[str]] = Query(None, alias="priority"),
    assignee: Optional[str] = Query(None),
    overdue: Optional[bool] = Query(None),
    sort_by: str = Query("created_at"),
    sort_dir: str = Query("desc", pattern="^(asc|desc)$"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if sort_by not in SORTABLE_FIELDS:
        raise ValidationError(
            f"Cannot sort by '{sort_by}'. Sortable fields: {', '.join(SORTABLE_FIELDS)}."
        )

    assignee_id, unassigned = _resolve_assignee(assignee, current_user)
    filters = TaskFilters(
        search=search.strip() if search else None,
        status=_parse_enum(_split(status_filter), TaskStatus, "status"),
        priority=_parse_enum(_split(priority_filter), TaskPriority, "priority"),
        assignee=assignee_id,
        unassigned=unassigned,
        overdue=overdue,
    )
    csv_text = TaskService(db).export_csv(filters, sort_by, sort_dir)
    stamp = datetime.now().strftime("%Y-%m-%d")
    return Response(
        content=csv_text,
        media_type="text/csv",
        headers={"Content-Disposition": f'attachment; filename="cadence-tasks-{stamp}.csv"'},
    )


@router.get("/{task_id}", response_model=TaskDetail, summary="Get one task")
def get_task(
    task_id: int = Path(..., ge=1),
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    return TaskService(db).get_task(task_id)


@router.put("/{task_id}", response_model=TaskDetail, summary="Update a task")
def update_task(
    payload: TaskUpdate,
    task_id: int = Path(..., ge=1),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return TaskService(db).update_task(task_id, payload, current_user.id)


@router.patch(
    "/{task_id}/status", response_model=TaskDetail, summary="Change only the status"
)
def change_status(
    payload: TaskStatusUpdate,
    task_id: int = Path(..., ge=1),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return TaskService(db).update_task(
        task_id, TaskUpdate(status=payload.status), current_user.id
    )


@router.delete(
    "/{task_id}", status_code=status.HTTP_204_NO_CONTENT, summary="Delete a task"
)
def delete_task(
    task_id: int = Path(..., ge=1),
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    TaskService(db).delete_task(task_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)


# --------------------------------------------------------------- comments
@router.get(
    "/{task_id}/comments", response_model=List[CommentRead], summary="List comments"
)
def list_comments(
    task_id: int = Path(..., ge=1),
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    return CommentService(db).list_for_task(task_id)


@router.post(
    "/{task_id}/comments",
    response_model=CommentRead,
    status_code=status.HTTP_201_CREATED,
    summary="Add a comment",
)
def add_comment(
    payload: CommentCreate,
    task_id: int = Path(..., ge=1),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return CommentService(db).add_comment(task_id, payload, current_user.id)


@router.delete(
    "/{task_id}/comments/{comment_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete a comment",
)
def delete_comment(
    task_id: int = Path(..., ge=1),
    comment_id: int = Path(..., ge=1),
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    CommentService(db).delete_comment(task_id, comment_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)
