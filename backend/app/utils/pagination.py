"""Pagination helpers shared by every list endpoint."""

from dataclasses import dataclass
from math import ceil
from typing import Generic, List, TypeVar

from app.schemas.common import Page, PageMeta

T = TypeVar("T")

MAX_LIMIT = 100
DEFAULT_LIMIT = 20


@dataclass(slots=True)
class PageParams:
    page: int = 1
    limit: int = DEFAULT_LIMIT

    def __post_init__(self) -> None:
        self.page = max(1, self.page)
        self.limit = max(1, min(self.limit, MAX_LIMIT))

    @property
    def offset(self) -> int:
        return (self.page - 1) * self.limit


@dataclass(slots=True)
class PagedResult(Generic[T]):
    items: List[T]
    total: int
    params: PageParams


def build_page(items: List[T], total: int, params: PageParams) -> Page:
    pages = ceil(total / params.limit) if total else 0
    return Page(
        items=items,
        meta=PageMeta(
            page=params.page,
            limit=params.limit,
            total=total,
            pages=pages,
            has_next=params.page < pages,
            has_prev=params.page > 1 and total > 0,
        ),
    )
