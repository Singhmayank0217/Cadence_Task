"""Application configuration.

All settings are read from environment variables (or a local `.env` file) so the
same image can run against SQLite locally and PostgreSQL in a shared
environment without any code change.
"""

import json
from functools import lru_cache
from typing import List, Optional

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    # ---- Application -----------------------------------------------------
    APP_NAME: str = "Cadence API"
    APP_ENV: str = "development"
    DEBUG: bool = True
    API_V1_PREFIX: str = "/api"

    # ---- Database --------------------------------------------------------
    # SQLite is the zero-config default. To use PostgreSQL, set:
    # DATABASE_URL=postgresql+psycopg2://user:password@localhost:5432/cadence
    DATABASE_URL: str = "sqlite:///./cadence.db"
    SQL_ECHO: bool = False

    # ---- Security --------------------------------------------------------
    SECRET_KEY: str = "change-me-in-production-please-use-a-long-random-string"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 12  # 12 hours

    # ---- CORS ------------------------------------------------------------
    # Kept as a plain string so it can be given as a comma separated list in
    # .env without needing JSON quoting. Read it through `cors_origins`.
    CORS_ORIGINS: str = "http://localhost:5173,http://127.0.0.1:5173,http://localhost:4173"
    # Browsers treat http://localhost:5173 and http://127.0.0.1:5173 as different
    # origins, and Vite picks a new port when 5173 is taken. Rather than make
    # people edit .env to get past a CORS error on their own machine, any
    # loopback origin is allowed. Set CORS_ALLOW_LOCALHOST=false in production.
    CORS_ALLOW_LOCALHOST: bool = True
    LOCALHOST_ORIGIN_REGEX: str = r"^https?://(localhost|127\.0\.0\.1|\[::1\])(:\d+)?$"

    # ---- External API integration ---------------------------------------
    EXTERNAL_API_BASE_URL: str = "https://jsonplaceholder.typicode.com"
    EXTERNAL_API_KEY: str = ""          # optional - sent as a bearer token when set
    EXTERNAL_API_TIMEOUT: float = 8.0   # seconds (connect + read)
    EXTERNAL_API_RETRIES: int = 2       # retries on timeout / 5xx
    EXTERNAL_API_CACHE_TTL: int = 300   # seconds
    EXTERNAL_API_RATE_LIMIT: int = 30   # max outbound calls per minute

    # ---- Seeding ---------------------------------------------------------
    SEED_ON_STARTUP: bool = True
    DEFAULT_PASSWORD: str = "password123"

    @property
    def cors_origins(self) -> List[str]:
        """Accepts either `a,b,c` or a JSON array."""
        raw = (self.CORS_ORIGINS or "").strip()
        if not raw:
            return []
        if raw.startswith("["):
            try:
                return [str(origin) for origin in json.loads(raw)]
            except ValueError:
                pass
        return [origin.strip() for origin in raw.split(",") if origin.strip()]

    @property
    def cors_origin_regex(self) -> Optional[str]:
        return self.LOCALHOST_ORIGIN_REGEX if self.CORS_ALLOW_LOCALHOST else None

    @property
    def is_sqlite(self) -> bool:
        return self.DATABASE_URL.startswith("sqlite")


@lru_cache
def get_settings() -> Settings:
    """Cached accessor so settings are parsed once per process."""
    return Settings()


settings = get_settings()
