"""Shared response envelopes and field types."""

from datetime import datetime
from typing import Annotated, Generic, List, Optional, TypeVar

from pydantic import AfterValidator, BaseModel, Field

from app.utils.datetime_utils import ensure_utc

# SQLite hands back naive datetimes; the API always emits UTC-aware ISO strings
# so the browser can localise them correctly.
UTCDateTime = Annotated[datetime, AfterValidator(ensure_utc)]

T = TypeVar("T")


class PageMeta(BaseModel):
    page: int = Field(..., description="Current 1-based page number")
    limit: int = Field(..., description="Items requested per page")
    total: int = Field(..., description="Total matching records")
    pages: int = Field(..., description="Total number of pages")
    has_next: bool
    has_prev: bool


class Page(BaseModel, Generic[T]):
    """Envelope returned by every list endpoint."""

    items: List[T]
    meta: PageMeta


class Message(BaseModel):
    message: str
    detail: Optional[str] = None
