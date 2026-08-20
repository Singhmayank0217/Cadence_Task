"""Cadence API - application entrypoint.

    uvicorn app.main:app --reload
"""

import logging
import time
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware

from app.api.v1.router import api_router
from app.core.config import settings
from app.core.exceptions import register_exception_handlers
from app.core.logging import configure_logging
from app.db.init_db import init_db

configure_logging("DEBUG" if settings.DEBUG else "INFO")
logger = logging.getLogger("cadence")


@asynccontextmanager
async def lifespan(_: FastAPI):
    init_db()
    if settings.SEED_ON_STARTUP:
        from app.db.seed import seed

        seed(reset=False)
    logger.info("%s ready on %s", settings.APP_NAME, settings.DATABASE_URL.split("://")[0])
    yield
    logger.info("Shutting down.")


app = FastAPI(
    title=settings.APP_NAME,
    version="1.1.0",
    description=(
        "Internal task and team management API.\n\n"
        "Every list endpoint returns `{items, meta}` and every error returns "
        "`{error: {code, message, details?}}`.\n\n"
        "Built by Mayank Singh."
    ),
    contact={"name": "Mayank Singh"},
    license_info={"name": "MIT"},
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_origin_regex=settings.cors_origin_regex,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["X-Process-Time"],
)

register_exception_handlers(app)


@app.middleware("http")
async def add_process_time_header(request: Request, call_next):
    started = time.perf_counter()
    response = await call_next(request)
    elapsed_ms = (time.perf_counter() - started) * 1000
    response.headers["X-Process-Time"] = f"{elapsed_ms:.1f}ms"
    if elapsed_ms > 500:
        logger.warning("Slow request %s %s took %.0fms", request.method, request.url.path, elapsed_ms)
    return response


@app.get("/", tags=["Health"], summary="Service banner")
def root():
    return {
        "service": settings.APP_NAME,
        "version": "1.1.0",
        "environment": settings.APP_ENV,
        "docs": "/docs",
        "api": settings.API_V1_PREFIX,
    }


@app.get("/health", tags=["Health"], summary="Health check")
def health():
    from sqlalchemy import text

    from app.core.database import engine

    try:
        with engine.connect() as connection:
            connection.execute(text("SELECT 1"))
        database = "up"
    except Exception:  # pragma: no cover - only hit when the DB is genuinely down
        database = "down"
    return {"status": "ok" if database == "up" else "degraded", "database": database}


app.include_router(api_router, prefix=settings.API_V1_PREFIX)
