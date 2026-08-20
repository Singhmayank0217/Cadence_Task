"""Domain exceptions and the handlers that turn them into JSON responses.

Every error the API returns has the same shape:

    {"error": {"code": "not_found", "message": "Task 42 was not found", "details": ...}}
"""

import logging
from typing import Any, Optional

from fastapi import FastAPI, Request, status
from fastapi.encoders import jsonable_encoder
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException as StarletteHTTPException

logger = logging.getLogger("cadence.errors")


class AppError(Exception):
    """Base class for all expected application errors."""

    status_code: int = status.HTTP_400_BAD_REQUEST
    code: str = "bad_request"

    def __init__(self, message: str, details: Optional[Any] = None):
        super().__init__(message)
        self.message = message
        self.details = details


class NotFoundError(AppError):
    status_code = status.HTTP_404_NOT_FOUND
    code = "not_found"


class ConflictError(AppError):
    status_code = status.HTTP_409_CONFLICT
    code = "conflict"


class ValidationError(AppError):
    status_code = status.HTTP_422_UNPROCESSABLE_ENTITY
    code = "validation_error"


class UnauthorizedError(AppError):
    status_code = status.HTTP_401_UNAUTHORIZED
    code = "unauthorized"


class ForbiddenError(AppError):
    status_code = status.HTTP_403_FORBIDDEN
    code = "forbidden"


class ExternalServiceError(AppError):
    """Raised when an upstream/third-party API fails us."""

    status_code = status.HTTP_502_BAD_GATEWAY
    code = "external_service_error"


class RateLimitError(AppError):
    status_code = status.HTTP_429_TOO_MANY_REQUESTS
    code = "rate_limited"


def _error_response(status_code: int, code: str, message: str, details: Any = None):
    payload: dict[str, Any] = {"error": {"code": code, "message": message}}
    if details is not None:
        payload["error"]["details"] = jsonable_encoder(details)
    return JSONResponse(status_code=status_code, content=payload)


def register_exception_handlers(app: FastAPI) -> None:
    @app.exception_handler(AppError)
    async def _handle_app_error(_: Request, exc: AppError):
        return _error_response(exc.status_code, exc.code, exc.message, exc.details)

    @app.exception_handler(RequestValidationError)
    async def _handle_validation(_: Request, exc: RequestValidationError):
        return _error_response(
            status.HTTP_422_UNPROCESSABLE_ENTITY,
            "validation_error",
            "The request body or query parameters are invalid.",
            exc.errors(),
        )

    @app.exception_handler(StarletteHTTPException)
    async def _handle_http(_: Request, exc: StarletteHTTPException):
        code = {401: "unauthorized", 403: "forbidden", 404: "not_found"}.get(
            exc.status_code, "http_error"
        )
        return _error_response(exc.status_code, code, str(exc.detail))

    @app.exception_handler(Exception)
    async def _handle_unexpected(request: Request, exc: Exception):
        logger.exception("Unhandled error on %s %s", request.method, request.url.path)
        return _error_response(
            status.HTTP_500_INTERNAL_SERVER_ERROR,
            "internal_error",
            "Something went wrong on our side. The error has been logged.",
        )
