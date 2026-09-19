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

    # Log backend configuration validation status
    google_status = "CONFIGURED" if (settings.GOOGLE_CLIENT_ID and settings.GOOGLE_CLIENT_SECRET) else "MISSING"
    weather_status = "CONFIGURED" if (settings.WEATHER_API_KEY or settings.OPENWEATHERMAP_API_KEY) else "CONFIGURED (Open-Meteo Fallback)"
    sms_configured = bool(
        (settings.TWILIO_ACCOUNT_SID and settings.TWILIO_AUTH_TOKEN)
        or settings.FAST2SMS_API_KEY
        or (settings.MSG91_AUTH_KEY and settings.MSG91_TEMPLATE_ID)
    )
    sms_status = "CONFIGURED" if sms_configured else "DEVELOPMENT MODE"

    logger.info("=== AGRI SHIELD BACKEND CONFIGURATION VALIDATION ===")
    logger.info(f"  Google OAuth 2.0 : {google_status}")
    logger.info(f"  Weather Service  : {weather_status}")
    logger.info(f"  SMS OTP Provider : {sms_status}")
    logger.info("====================================================")

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
        "http://localhost:5174",
        "http://127.0.0.1:5174",
        "http://localhost:5175",
        "http://127.0.0.1:5175",
        "http://localhost:5176",
        "http://127.0.0.1:5176",
        "http://127.0.0.1:3000",
        "http://localhost:8000",
        "http://127.0.0.1:8000",
        "http://10.0.30.9:5173",
        "http://10.0.30.9:3000",
    ]
    if settings.ALLOWED_CORS_ORIGINS:
        for orig in settings.ALLOWED_CORS_ORIGINS:
            if orig not in origins:
                origins.append(str(orig))

    app.add_middleware(
        CORSMiddleware,
        allow_origins=origins,
        allow_origin_regex=r"http://(localhost|127\.0\.0\.1|10\.\d+\.\d+\.\d+)(:\d+)?",
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
        import traceback
        with open("ml_route_error.log", "w") as f:
            f.write(traceback.format_exc())
        logger.warning(f"Could not register Multi-Crop ML API routes: {e}")

    return app


app = create_application()
