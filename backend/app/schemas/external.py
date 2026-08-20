from typing import List, Optional

from pydantic import BaseModel, Field


class ExternalUser(BaseModel):
    """Normalised shape of a record pulled from the third-party directory."""

    external_id: str
    name: str
    email: str
    username: Optional[str] = None
    phone: Optional[str] = None
    company: Optional[str] = None
    website: Optional[str] = None
    city: Optional[str] = None
    avatar_url: Optional[str] = None
    already_imported: bool = False


class ExternalUsersResponse(BaseModel):
    source: str
    fetched_at: str
    cached: bool = False
    count: int
    items: List[ExternalUser]


class ImportExternalUserRequest(BaseModel):
    external_id: str = Field(..., min_length=1, max_length=64)
