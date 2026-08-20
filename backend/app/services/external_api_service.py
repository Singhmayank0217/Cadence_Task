"""Third-party directory integration.

Talks to a public REST API (JSONPlaceholder by default) and demonstrates the
things that matter when you depend on someone else's service:

* explicit connect/read **timeouts** so a slow upstream can't hang our workers
* **retries with exponential backoff** on timeouts and 5xx only - never on 4xx
* an outbound **token-bucket rate limiter** so we stay inside their quota
* a short-lived **response cache** so repeated page loads don't burn quota
* **API-key auth** support (sent as a bearer header when configured)
* upstream failures mapped to 502/504 with a readable message, never a stack trace
"""

import logging
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

import httpx
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.exceptions import (
    ConflictError,
    ExternalServiceError,
    NotFoundError,
    RateLimitError,
)
from app.core.security import hash_password
from app.models.enums import UserRole
from app.repositories import UserRepository
from app.schemas.external import ExternalUser, ExternalUsersResponse
from app.schemas.user import UserRead
from app.utils.cache import TTLCache
from app.utils.rate_limit import per_minute

logger = logging.getLogger("cadence.external")

_cache = TTLCache(ttl_seconds=settings.EXTERNAL_API_CACHE_TTL)
_bucket = per_minute(settings.EXTERNAL_API_RATE_LIMIT)

CACHE_KEY = "external:users"


class ExternalApiService:
    def __init__(self, db: Optional[Session] = None):
        self.db = db
        self.users = UserRepository(db) if db is not None else None
        self.base_url = settings.EXTERNAL_API_BASE_URL.rstrip("/")

    # ------------------------------------------------------------- transport
    def _headers(self) -> Dict[str, str]:
        headers = {"Accept": "application/json", "User-Agent": "Cadence/1.0"}
        if settings.EXTERNAL_API_KEY:
            headers["Authorization"] = f"Bearer {settings.EXTERNAL_API_KEY}"
        return headers

    def _get(self, path: str) -> Any:
        """GET with timeout, bounded retries and upstream error translation."""
        if not _bucket.try_acquire():
            raise RateLimitError(
                "The directory sync is rate limited right now. "
                f"Try again in {_bucket.retry_after()}s.",
            )

        url = f"{self.base_url}{path}"
        timeout = httpx.Timeout(
            settings.EXTERNAL_API_TIMEOUT, connect=min(4.0, settings.EXTERNAL_API_TIMEOUT)
        )
        last_error: Optional[Exception] = None

        for attempt in range(settings.EXTERNAL_API_RETRIES + 1):
            try:
                with httpx.Client(timeout=timeout, follow_redirects=True) as client:
                    response = client.get(url, headers=self._headers())

                if response.status_code == 429:
                    raise RateLimitError(
                        "The upstream directory returned a rate-limit response. "
                        "Wait a moment and retry."
                    )
                if 400 <= response.status_code < 500:
                    # Client errors are our fault - retrying will not help.
                    raise ExternalServiceError(
                        f"The directory rejected the request ({response.status_code}).",
                        details={"url": url, "status": response.status_code},
                    )
                response.raise_for_status()
                return response.json()

            except (httpx.TimeoutException, httpx.HTTPStatusError, httpx.TransportError) as exc:
                last_error = exc
                if attempt < settings.EXTERNAL_API_RETRIES:
                    backoff = 0.4 * (2**attempt)
                    logger.warning(
                        "External call failed (%s). Retrying in %.1fs [%d/%d]",
                        exc.__class__.__name__,
                        backoff,
                        attempt + 1,
                        settings.EXTERNAL_API_RETRIES,
                    )
                    import time

                    time.sleep(backoff)
                    continue
            except ValueError as exc:  # invalid JSON
                raise ExternalServiceError(
                    "The directory returned a response we couldn't read."
                ) from exc

        if isinstance(last_error, httpx.TimeoutException):
            raise ExternalServiceError(
                f"The directory did not respond within {settings.EXTERNAL_API_TIMEOUT:.0f}s."
            ) from last_error
        raise ExternalServiceError(
            "The directory is unavailable right now. Try again shortly."
        ) from last_error

    # --------------------------------------------------------------- mapping
    @staticmethod
    def _normalise(raw: Dict[str, Any]) -> ExternalUser:
        """Map an upstream record onto our own shape, defensively."""
        address = raw.get("address") or {}
        company = raw.get("company") or {}
        name = str(raw.get("name") or raw.get("username") or "Unknown")
        seed = str(raw.get("username") or raw.get("id") or name).replace(" ", "")
        return ExternalUser(
            external_id=str(raw.get("id", seed)),
            name=name,
            email=str(raw.get("email", "")).lower(),
            username=raw.get("username"),
            phone=str(raw.get("phone")) if raw.get("phone") else None,
            company=company.get("name") if isinstance(company, dict) else None,
            website=raw.get("website"),
            city=address.get("city") if isinstance(address, dict) else None,
            avatar_url=f"https://api.dicebear.com/7.x/notionists/svg?seed={seed}",
        )

    # ----------------------------------------------------------------- public
    def fetch_users(self, refresh: bool = False) -> ExternalUsersResponse:
        cached = None if refresh else _cache.get(CACHE_KEY)
        if cached is None:
            payload = self._get("/users")
            records = payload.get("users", payload) if isinstance(payload, dict) else payload
            if not isinstance(records, list):
                raise ExternalServiceError("The directory returned an unexpected format.")
            items = [self._normalise(record) for record in records if isinstance(record, dict)]
            cached = {
                "items": [item.model_dump() for item in items],
                "fetched_at": datetime.now(timezone.utc).isoformat(),
            }
            _cache.set(CACHE_KEY, cached)
            was_cached = False
        else:
            was_cached = True

        items = [ExternalUser(**item) for item in cached["items"]]

        # Flag records that already exist locally so the UI can disable "Import".
        if self.users is not None:
            known = {user.email.lower() for user in self.users.all_active()}
            for item in items:
                item.already_imported = item.email.lower() in known

        return ExternalUsersResponse(
            source=self.base_url,
            fetched_at=cached["fetched_at"],
            cached=was_cached,
            count=len(items),
            items=items,
        )

    def import_user(self, external_id: str) -> UserRead:
        """Copy a directory record into our own users table."""
        if self.users is None or self.db is None:
            raise ExternalServiceError("Import requires a database session.")

        directory = self.fetch_users()
        match: Optional[ExternalUser] = next(
            (item for item in directory.items if item.external_id == external_id), None
        )
        if not match:
            raise NotFoundError(f"No directory record with id {external_id}.")
        if self.users.get_by_email(match.email):
            raise ConflictError(f"{match.email} is already on the team.")

        user = self.users.create(
            name=match.name,
            email=match.email,
            role=UserRole.MEMBER,
            job_title=f"{match.company}" if match.company else "Imported contact",
            avatar_url=match.avatar_url,
            hashed_password=hash_password(settings.DEFAULT_PASSWORD),
            source="external_directory",
        )
        self.db.commit()
        return UserRead.model_validate(user, from_attributes=True)

    @staticmethod
    def cache_status() -> Dict[str, Any]:
        return {
            "cached": _cache.get(CACHE_KEY) is not None,
            "ttl_seconds": settings.EXTERNAL_API_CACHE_TTL,
            "rate_limit_per_minute": settings.EXTERNAL_API_RATE_LIMIT,
            "retry_after": _bucket.retry_after(),
        }

    @staticmethod
    def clear_cache() -> None:
        _cache.clear()
