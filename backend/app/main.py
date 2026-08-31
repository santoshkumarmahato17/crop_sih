from contextlib import asynccontextmanager
from typing import AsyncGenerator

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app import __version__
from app.api.v1.router import api_router
from app.core.config import get_settings
from app.core.errors import register_error_handlers
from app.core.logging import logger, setup_logging

settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    """Application startup and shutdown lifecycle event management."""
    setup_logging()
    logger.info(
        f"Starting {settings.PROJECT_NAME} v{__version__} [Env: {settings.ENVIRONMENT}]"
    )
    yield
    logger.info(f"Shutting down {settings.PROJECT_NAME} gracefully.")


def create_application() -> FastAPI:
    """Application factory for AGRI SHIELD Backend."""
    app = FastAPI(
        title="AGRI SHIELD API",
        description=(
            "Enterprise backend API for AGRI SHIELD: AI-Powered Crop Health Monitoring, "
            "Disease Early Detection and Spread Intelligence System."
        ),
        version=__version__,
        docs_url="/docs",
        redoc_url="/redoc",
        openapi_url=f"{settings.API_V1_STR}/openapi.json",
        lifespan=lifespan,
    )

    # Permissive CORS Configuration for local development
    origins = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:8000",
        "http://127.0.0.1:8000",
    ]
    if settings.ALLOWED_CORS_ORIGINS:
        for orig in settings.ALLOWED_CORS_ORIGINS:
            if orig not in origins:
                origins.append(str(orig))

    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"] if settings.DEBUG else origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # Centralized Error Handlers
    register_error_handlers(app, debug=settings.DEBUG)

    # Root System Health & Landing Endpoints
    @app.get("/", tags=["System Landing"])
    async def root():
        return {
            "system": "AGRI SHIELD",
            "tagline": "AI-Powered Crop Health Monitoring, Disease Early Detection and Spread Intelligence System",
            "version": __version__,
            "status": "online",
            "documentation": "/docs",
            "api_v1": settings.API_V1_STR,
            "health_probe": f"{settings.API_V1_STR}/health",
        }

    @app.get("/health", tags=["System Landing"])
    async def quick_health():
        return {
            "status": "healthy",
            "system": "AGRI SHIELD",
            "version": __version__,
        }

    # Mount API v1 Router
    app.include_router(api_router, prefix=settings.API_V1_STR)

    return app


app = create_application()
