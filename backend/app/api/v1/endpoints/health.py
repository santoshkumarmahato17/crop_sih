import time
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, status
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app import __version__
from app.core.config import Settings, get_settings
from app.db.session import get_db
from app.schemas.health import HealthCheckResponse, SubsystemHealth

router = APIRouter(tags=["System Health"])


@router.get(
    "/health",
    response_model=HealthCheckResponse,
    status_code=status.HTTP_200_OK,
    summary="System Health & Readiness Probe",
    description="Returns the runtime operational status and diagnostic latency for core AGRI SHIELD subsystems.",
)
async def check_health(
    db: AsyncSession = Depends(get_db),
    settings: Settings = Depends(get_settings),
) -> HealthCheckResponse:
    """Comprehensive readiness probe verifying database connectivity."""
    subsystems = {}
    overall_status = "healthy"

    # 1. Check Database Connectivity (PostGIS or SQLite Fallback)
    db_start = time.perf_counter()
    try:
        bind_dialect = db.bind.dialect.name if db.bind else ""
        if bind_dialect == "sqlite":
            result = await db.execute(text("SELECT sqlite_version();"))
            sqlite_ver = result.scalar()
            db_latency = round((time.perf_counter() - db_start) * 1000, 2)
            subsystems["database"] = SubsystemHealth(
                status="operational",
                latency_ms=db_latency,
                details=f"SQLite Resilient Engine: v{sqlite_ver} (Geometry shims active)",
            )
        else:
            result = await db.execute(text("SELECT postgis_version();"))
            postgis_ver = result.scalar()
            db_latency = round((time.perf_counter() - db_start) * 1000, 2)
            subsystems["postgis"] = SubsystemHealth(
                status="operational",
                latency_ms=db_latency,
                details=f"PostGIS Version: {postgis_ver}",
            )
    except Exception as e:
        db_latency = round((time.perf_counter() - db_start) * 1000, 2)
        subsystems["database"] = SubsystemHealth(
            status="unavailable",
            latency_ms=db_latency,
            details=f"Database probe failed: {str(e)}",
        )
        overall_status = "degraded"

    # 2. Redis Subsystem Status Record
    subsystems["redis"] = SubsystemHealth(
        status="configured",
        details=f"Target: {settings.REDIS_HOST}:{settings.REDIS_PORT}",
    )

    # 3. MinIO Object Storage Status Record
    subsystems["minio_storage"] = SubsystemHealth(
        status="configured",
        details=f"Endpoint: {settings.MINIO_ENDPOINT}",
    )

    return HealthCheckResponse(
        system="AGRI SHIELD",
        version=__version__,
        environment=settings.ENVIRONMENT,
        status=overall_status,
        timestamp=datetime.now(timezone.utc),
        subsystems=subsystems,
    )
