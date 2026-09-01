from fastapi import APIRouter

from app.api.v1.endpoints import (
    adaptive,
    ai,
    alerts,
    assistant,
    auth,
    community,
    dashboard,
    diagnosis,
    drones,
    farms,
    health,
    images,
    officer,
    risk,
    spread,
    temporal,
    water_stress,
    zones,
)

api_router = APIRouter()

# Register core system endpoints
api_router.include_router(health.router)
api_router.include_router(auth.router)
api_router.include_router(community.router)
api_router.include_router(assistant.router)
api_router.include_router(dashboard.router)
api_router.include_router(diagnosis.router)
api_router.include_router(officer.router)
api_router.include_router(adaptive.router)
api_router.include_router(alerts.router)
api_router.include_router(farms.router)
api_router.include_router(zones.router)
api_router.include_router(drones.router)
api_router.include_router(images.router)
api_router.include_router(ai.router)
api_router.include_router(temporal.router)
api_router.include_router(risk.router)
api_router.include_router(spread.router)
api_router.include_router(water_stress.router)

