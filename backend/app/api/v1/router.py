"""Mounts every v1 route module under the configured API prefix."""

from fastapi import APIRouter

from app.api.v1.routes import auth, dashboard, external, tasks, users

api_router = APIRouter()
api_router.include_router(auth.router)
api_router.include_router(dashboard.router)
api_router.include_router(tasks.router)
api_router.include_router(users.router)
api_router.include_router(external.router)
