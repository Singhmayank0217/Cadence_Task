"""Generic CRUD repository.

Repositories own *all* SQLAlchemy usage. Services talk to repositories, routes
talk to services - so swapping the persistence layer never touches HTTP code.
"""

from typing import Any, Dict, Generic, List, Optional, Sequence, Type, TypeVar

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.core.database import Base

ModelType = TypeVar("ModelType", bound=Base)


class BaseRepository(Generic[ModelType]):
    def __init__(self, model: Type[ModelType], db: Session):
        self.model = model
        self.db = db

    def get(self, obj_id: int) -> Optional[ModelType]:
        return self.db.get(self.model, obj_id)

    def list(self, limit: int = 100, offset: int = 0) -> Sequence[ModelType]:
        stmt = select(self.model).limit(limit).offset(offset)
        return self.db.execute(stmt).unique().scalars().all()

    def count(self) -> int:
        return self.db.execute(select(func.count()).select_from(self.model)).scalar_one()

    def create(self, **values: Any) -> ModelType:
        obj = self.model(**values)
        self.db.add(obj)
        self.db.flush()
        self.db.refresh(obj)
        return obj

    def update(self, obj: ModelType, values: Dict[str, Any]) -> ModelType:
        for field, value in values.items():
            setattr(obj, field, value)
        self.db.add(obj)
        self.db.flush()
        self.db.refresh(obj)
        return obj

    def delete(self, obj: ModelType) -> None:
        self.db.delete(obj)
        self.db.flush()

    def bulk_add(self, objects: List[ModelType]) -> None:
        self.db.add_all(objects)
        self.db.flush()
