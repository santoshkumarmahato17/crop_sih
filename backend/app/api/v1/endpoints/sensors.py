import uuid
from datetime import datetime, timezone
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_db, get_current_user
from app.models.auth import User
from app.models.sensor import (
    FieldSensor,
    FieldSensorReading,
    PestTrap,
    PestTrapObservation,
    SensorType,
    TrapType,
    DataQualityStatus,
)
from app.services.sensor_engine import sensor_engine

router = APIRouter()

# --- Schemas ---
class SensorCreate(BaseModel):
    farm_id: str
    zone_id: Optional[str] = None
    sensor_type: SensorType
    status: str = "ACTIVE"
    source_device_id: Optional[str] = None

class SensorReadingCreate(BaseModel):
    sensor_id: str
    measurement: float
    unit: str
    timestamp: Optional[datetime] = None
    source: str = "API"

class TrapCreate(BaseModel):
    farm_id: str
    zone_id: Optional[str] = None
    trap_type: TrapType
    status: str = "ACTIVE"
    notes: Optional[str] = None

class TrapObservationCreate(BaseModel):
    trap_id: str
    pest_name: str
    count: int
    observation_time: Optional[datetime] = None
    source: str = "MANUAL"
    notes: Optional[str] = None


# --- Endpoints ---
@router.post("", status_code=status.HTTP_201_CREATED)
async def create_sensor(
    data: SensorCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # RBAC check omitted for brevity in snippet; would verify farm_id
    sensor = FieldSensor(
        id=str(uuid.uuid4()),
        farm_id=data.farm_id,
        zone_id=data.zone_id,
        sensor_type=data.sensor_type,
        status=data.status,
        source_device_id=data.source_device_id,
    )
    db.add(sensor)
    await db.commit()
    return {"id": sensor.id, "status": "created"}

@router.post("/readings", status_code=status.HTTP_201_CREATED)
async def create_sensor_reading(
    data: SensorReadingCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # Retrieve Sensor
    res = await db.execute(select(FieldSensor).where(FieldSensor.id == data.sensor_id))
    sensor = res.scalars().first()
    if not sensor:
        raise HTTPException(status_code=404, detail="Sensor not found")

    timestamp = data.timestamp or datetime.now(timezone.utc)
    
    # 1. Validation Logic
    quality = sensor_engine.validate_reading(sensor.sensor_type, data.measurement, data.unit)
    if quality == DataQualityStatus.INVALID:
        raise HTTPException(status_code=422, detail=f"Measurement physically impossible for {sensor.sensor_type}")
        
    # 2. Freshness Engine
    freshness = sensor_engine.calculate_freshness(timestamp)

    reading = FieldSensorReading(
        id=str(uuid.uuid4()),
        sensor_id=sensor.id,
        farm_id=sensor.farm_id,
        zone_id=sensor.zone_id,
        sensor_type=sensor.sensor_type,
        measurement=data.measurement,
        unit=data.unit,
        timestamp=timestamp,
        quality_status=quality,
        freshness=freshness,
        source=data.source,
    )
    db.add(reading)
    await db.commit()
    return {"id": reading.id, "status": "created", "quality": quality, "freshness": freshness}


@router.post("/pest-traps", status_code=status.HTTP_201_CREATED)
async def create_trap(
    data: TrapCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    trap = PestTrap(
        id=str(uuid.uuid4()),
        farm_id=data.farm_id,
        zone_id=data.zone_id,
        trap_type=data.trap_type,
        status=data.status,
        notes=data.notes,
    )
    db.add(trap)
    await db.commit()
    return {"id": trap.id, "status": "created"}


@router.post("/pest-traps/{trap_id}/observations", status_code=status.HTTP_201_CREATED)
async def create_trap_observation(
    trap_id: str,
    data: TrapObservationCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if trap_id != data.trap_id:
        raise HTTPException(status_code=400, detail="Trap ID mismatch")
        
    res = await db.execute(select(PestTrap).where(PestTrap.id == trap_id))
    trap = res.scalars().first()
    if not trap:
        raise HTTPException(status_code=404, detail="Pest Trap not found")

    obs_time = data.observation_time or datetime.now(timezone.utc)
    
    # Validation
    if data.count < 0:
        raise HTTPException(status_code=422, detail="Pest count cannot be negative")
        
    obs = PestTrapObservation(
        id=str(uuid.uuid4()),
        trap_id=trap.id,
        farm_id=trap.farm_id,
        zone_id=trap.zone_id,
        pest_name=data.pest_name,
        count=data.count,
        observation_time=obs_time,
        observer_id=current_user.id,
        source=data.source,
        notes=data.notes,
    )
    db.add(obs)
    await db.commit()
    return {"id": obs.id, "status": "created"}
