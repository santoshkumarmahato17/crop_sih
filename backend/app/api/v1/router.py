from fastapi import APIRouter

from app.api.v1.endpoints import (
    adaptive,
    admin,
    advisories,
    ai,
    alerts,
    assistant,
    auth,
    community,
    dashboard,
    dataset,
    diagnosis,
    drones,
    farms,
    government,
    health,
    images,
    monitoring,
    officer,
    predict,
    risk,
    spread,
    temporal,
    validation,
    water_stress,
    weather_forecast,
    zones,
)

api_router = APIRouter()

# Register core system endpoints
api_router.include_router(health.router)
api_router.include_router(auth.router)
api_router.include_router(admin.router)
api_router.include_router(government.router)
api_router.include_router(community.router)
api_router.include_router(assistant.router)
api_router.include_router(dashboard.router)
api_router.include_router(dataset.router)
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
api_router.include_router(weather_forecast.router)
api_router.include_router(validation.router)
api_router.include_router(predict.router)
api_router.include_router(advisories.router)
api_router.include_router(monitoring.router)

