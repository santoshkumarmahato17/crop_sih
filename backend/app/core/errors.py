from typing import Any, Dict, Optional
from fastapi import FastAPI, Request, status
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException as StarletteHTTPException

from app.core.logging import logger


class KisanSathiException(Exception):
    """Base domain exception for KISAN SATHI."""

    def __init__(self, message: str, status_code: int = 400, details: Optional[Any] = None):
        super().__init__(message)
        self.message = message
        self.status_code = status_code
        self.details = details


class EntityNotFoundError(KisanSathiException):
    """Raised when a requested entity does not exist."""

    def __init__(self, entity_name: str, entity_id: Any):
        super().__init__(
            message=f"{entity_name} with ID '{entity_id}' was not found.",
            status_code=status.HTTP_404_NOT_FOUND,
        )


class SpatialValidationError(KisanSathiException):
    """Raised when spatial geometry or CRS validation fails."""

    def __init__(self, message: str, details: Optional[Any] = None):
        super().__init__(
            message=f"Spatial Validation Error: {message}",
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            details=details,
        )


def register_error_handlers(app: FastAPI, debug: bool = False) -> None:
    """Registers standardized JSON error handlers conforming to RFC 7807."""

    @app.exception_handler(KisanSathiException)
    async def kisansathi_exception_handler(
        request: Request, exc: KisanSathiException
    ) -> JSONResponse:
        logger.warning(f"Domain error at {request.method} {request.url.path}: {exc.message}")
        origin = request.headers.get("origin")
        headers = {}
        if origin:
            headers["access-control-allow-origin"] = origin
            headers["access-control-allow-credentials"] = "true"
        return JSONResponse(
            status_code=exc.status_code,
            content={
                "success": False,
                "message": exc.message,
                "detail": exc.details,
            },
            headers=headers,
        )

    @app.exception_handler(StarletteHTTPException)
    async def http_exception_handler(
        request: Request, exc: StarletteHTTPException
    ) -> JSONResponse:
        origin = request.headers.get("origin")
        headers = {}
        if origin:
            headers["access-control-allow-origin"] = origin
            headers["access-control-allow-credentials"] = "true"
        if getattr(exc, "headers", None):
            headers.update(exc.headers)
            
        return JSONResponse(
            status_code=exc.status_code,
            content={
                "success": False,
                "message": exc.detail if isinstance(exc.detail, str) else "HTTP Error",
                "detail": exc.detail if not isinstance(exc.detail, str) else None,
            },
            headers=headers,
        )

    @app.exception_handler(RequestValidationError)
    async def validation_exception_handler(
        request: Request, exc: RequestValidationError
    ) -> JSONResponse:
        errors = exc.errors()
        formatted_errors = [
            {"loc": list(err["loc"]), "msg": err["msg"], "type": err["type"]}
            for err in errors
        ]
        return JSONResponse(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            content={
                "success": False,
                "message": "Request validation failed.",
                "detail": formatted_errors,
            },
        )

    @app.exception_handler(Exception)
    async def unhandled_exception_handler(request: Request, exc: Exception) -> JSONResponse:
        logger.error(
            f"Unhandled server error at {request.method} {request.url.path}: {str(exc)}",
            exc_info=True,
        )
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={
                "success": False,
                "message": "An unexpected internal server error occurred.",
                "detail": str(exc) if debug else None,
            },
        )
