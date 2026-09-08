import os
import sys

# Ensure repository root is in sys.path
REPO_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "../.."))
if REPO_ROOT not in sys.path:
    sys.path.insert(0, REPO_ROOT)

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

from app.db.session import init_db


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    """Application startup and shutdown lifecycle event management."""
    setup_logging()
    logger.info(
        f"Starting {settings.PROJECT_NAME} v{__version__} [Env: {settings.ENVIRONMENT}]"
    )
    # Initialize database tables and initial dataset
    await init_db()
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

    # Mount Predict and AI Endpoints directly at root for easy access (/predict, /ai/...)
    from app.api.v1.endpoints import predict, ai
    app.include_router(predict.router)
    app.include_router(ai.router)

    # Mount Tomato, Cassava, Cashew, Maize & YOLO ML Pipeline API routes
    try:
        from ml.api.app import app as ml_app
        app.include_router(ml_app.router)
        logger.info("Successfully registered Multi-Crop ML API routes (/api/cassava, /api/cashew, /api/maize, /api/predict, /api/yolo)")
    except Exception as e:
        logger.warning(f"Could not register Multi-Crop ML API routes: {e}")

    return app


app = create_application()
