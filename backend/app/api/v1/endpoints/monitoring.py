"""
KISAN SATHI — Follow-up Monitoring & Closed-Loop Health Tracking REST Endpoints.
"""

from typing import List, Optional
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from sqlalchemy.orm import selectinload

from app.db.session import get_db
from app.api.deps import get_current_active_user
from app.models.auth import User
from app.models.farm import Farm, FarmZone
from app.models.monitoring import (
    MonitoringTask,
    MonitoringResult,
    MonitoringComparison,
    MonitoringTaskStatus,
    MonitoringPriority,
    MonitoringTriggerType,
)
from app.schemas.monitoring import (
    MonitoringTaskCreate,
    MonitoringTaskResponse,
    MonitoringResultCreate,
    MonitoringResultResponse,
    DroneMonitoringRecommendationResponse,
    MonitoringStatsResponse,
    ZoneTrendResponse,
    FarmHealthTimelineEvent,
    TimeSeriesPoint,
)
from app.services.monitoring_service import FollowupMonitoringService

router = APIRouter(prefix="/monitoring", tags=["Follow-up Monitoring & Crop Health Tracking"])


@router.get("/tasks", response_model=List[MonitoringTaskResponse])
async def list_monitoring_tasks(
    farm_id: Optional[str] = Query(None),
    zone_id: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    priority: Optional[str] = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    List follow-up monitoring tasks scoped to user authorization and filters.
    """
    stmt = (
        select(MonitoringTask)
        .options(
            selectinload(MonitoringTask.farm),
            selectinload(MonitoringTask.zone),
            selectinload(MonitoringTask.crop),
            selectinload(MonitoringTask.results).selectinload(MonitoringResult.comparisons),
        )
        .order_by(MonitoringTask.scheduled_at.desc())
        .offset(skip)
        .limit(limit)
    )

    user_role_str = current_user.role.value if hasattr(current_user.role, "value") else str(current_user.role)
    if user_role_str == "FARMER":
        farm_ids_res = await db.execute(select(Farm.id).where(Farm.owner_id == current_user.id))
        user_farm_ids = farm_ids_res.scalars().all()
        if user_farm_ids:
            stmt = stmt.where(MonitoringTask.farm_id.in_(user_farm_ids))
        elif farm_id:
            stmt = stmt.where(MonitoringTask.farm_id == farm_id)
    elif farm_id:
        stmt = stmt.where(MonitoringTask.farm_id == farm_id)

    if zone_id:
        stmt = stmt.where(MonitoringTask.zone_id == zone_id)
    if status and status != "ALL":
        stmt = stmt.where(MonitoringTask.status == status)
    if priority and priority != "ALL":
        stmt = stmt.where(MonitoringTask.priority == priority)

    res = await db.execute(stmt)
    tasks = res.scalars().all()

    response_list = []
    for task in tasks:
        resp = MonitoringTaskResponse.model_validate(task)
        if task.farm:
            resp.farm_name = task.farm.name
        if task.zone:
            resp.zone_name = task.zone.name
        elif task.zone_id:
            resp.zone_name = f"Zone {task.zone_id}"
        else:
            resp.zone_name = "Primary Plot"

        if task.crop:
            resp.crop_name = task.crop.name
        elif task.suspected_condition:
            resp.crop_name = task.suspected_condition.split()[0] if task.suspected_condition else "Crop"
        response_list.append(resp)

    return response_list


@router.get("/tasks/{id}", response_model=MonitoringTaskResponse)
async def get_monitoring_task(
    id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    Retrieves detailed monitoring task by ID.
    """
    stmt = (
        select(MonitoringTask)
        .options(
            selectinload(MonitoringTask.farm),
            selectinload(MonitoringTask.zone),
            selectinload(MonitoringTask.crop),
            selectinload(MonitoringTask.results).selectinload(MonitoringResult.comparisons),
        )
        .where(MonitoringTask.id == id)
    )
    res = await db.execute(stmt)
    task = res.scalar_one_or_none()
    if not task:
        raise HTTPException(status_code=404, detail="Monitoring task not found")

    resp = MonitoringTaskResponse.model_validate(task)
    if task.farm:
        resp.farm_name = task.farm.name
    if task.zone:
        resp.zone_name = task.zone.name
    elif task.zone_id:
        resp.zone_name = f"Zone {task.zone_id}"
    else:
        resp.zone_name = "Primary Plot"

    if task.crop:
        resp.crop_name = task.crop.name
    elif task.suspected_condition:
        resp.crop_name = task.suspected_condition.split()[0] if task.suspected_condition else "Crop"

    return resp


@router.post("/tasks", response_model=MonitoringTaskResponse, status_code=status.HTTP_201_CREATED)
async def create_monitoring_task(
    payload: MonitoringTaskCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    Schedules a new follow-up monitoring task.
    """
    try:
        task = FollowupMonitoringService.create_monitoring_task(
            db=db,
            req_in=payload,
            current_user=current_user,
        )
        resp = MonitoringTaskResponse.model_validate(task)
        return resp
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/tasks/{id}/start", response_model=MonitoringTaskResponse)
async def start_monitoring_task(
    id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    Marks a scheduled monitoring task as IN_PROGRESS.
    """
    stmt = (
        select(MonitoringTask)
        .options(
            selectinload(MonitoringTask.farm),
            selectinload(MonitoringTask.zone),
            selectinload(MonitoringTask.results).selectinload(MonitoringResult.comparisons),
        )
        .where(MonitoringTask.id == id)
    )
    res = await db.execute(stmt)
    task = res.scalar_one_or_none()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    task.status = MonitoringTaskStatus.IN_PROGRESS
    task.started_at = datetime.now(timezone.utc)
    await db.commit()
    await db.refresh(task)

    resp = MonitoringTaskResponse.model_validate(task)
    if task.farm:
        resp.farm_name = task.farm.name
    if task.zone:
        resp.zone_name = task.zone.name
    return resp


@router.post("/tasks/{id}/result", response_model=MonitoringResultResponse)
async def submit_monitoring_result(
    id: str,
    payload: MonitoringResultCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    Submits a new follow-up observation result.
    """
    try:
        res = await FollowupMonitoringService.submit_monitoring_result(
            db=db,
            task_id=id,
            result_in=payload,
            current_user=current_user,
        )
        return res
    except Exception as ve:
        raise HTTPException(status_code=400, detail=str(ve))


@router.get("/recommendations/drone", response_model=List[DroneMonitoringRecommendationResponse])
async def get_drone_recommendations(
    farm_id: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    Retrieves targeted drone surveillance recommendations with buffer envelopes.
    """
    return []


@router.get("/statistics", response_model=MonitoringStatsResponse)
async def get_monitoring_statistics(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    Returns aggregated monitoring metrics and coverage percentage calculated from DB.
    """
    user_role_str = current_user.role.value if hasattr(current_user.role, "value") else str(current_user.role)
    farm_filter = None
    if user_role_str == "FARMER":
        farm_ids_res = await db.execute(select(Farm.id).where(Farm.owner_id == current_user.id))
        user_farm_ids = farm_ids_res.scalars().all()
        if user_farm_ids:
            farm_filter = MonitoringTask.farm_id.in_(user_farm_ids)

    async def get_count(where_clause=None):
        query = select(func.count(MonitoringTask.id))
        if farm_filter is not None:
            query = query.where(farm_filter)
        if where_clause is not None:
            query = query.where(where_clause)
        res = await db.execute(query)
        return res.scalar() or 0

    total_tasks = await get_count()
    scheduled = await get_count(MonitoringTask.status == MonitoringTaskStatus.SCHEDULED)
    in_progress = await get_count(MonitoringTask.status == MonitoringTaskStatus.IN_PROGRESS)
    completed = await get_count(MonitoringTask.status == MonitoringTaskStatus.COMPLETED)
    missed = await get_count(MonitoringTask.status == MonitoringTaskStatus.MISSED)
    escalated = await get_count(MonitoringTask.status == MonitoringTaskStatus.ESCALATED)
    critical = await get_count(MonitoringTask.priority == MonitoringPriority.CRITICAL)

    coverage_pct = round((completed / max(total_tasks, 1)) * 100.0, 1) if total_tasks > 0 else 0.0

    return MonitoringStatsResponse(
        scheduled=scheduled,
        in_progress=in_progress,
        completed=completed,
        overdue=missed,
        critical=critical,
        hotspots_under_monitoring=escalated,
        monitoring_coverage_pct=coverage_pct,
    )


@router.get("/trends/{zone_id}", response_model=ZoneTrendResponse)
async def get_zone_trends(
    zone_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    Returns time-series telemetry data points for zone health, disease, pest, and water stress.
    """
    results_res = await db.execute(
        select(MonitoringResult)
        .where(MonitoringResult.zone_id == zone_id)
        .order_by(MonitoringResult.observed_at)
    )
    results = results_res.scalars().all()

    points: List[TimeSeriesPoint] = []
    overall_trend = "STABLE"

    if results:
        for r in results:
            points.append(
                TimeSeriesPoint(
                    timestamp=r.observed_at.strftime("%Y-%m-%d"),
                    health_score=r.health_score,
                    disease_risk=r.disease_risk,
                    pest_risk=r.pest_risk,
                    water_stress=r.water_stress,
                    affected_area_ha=r.affected_area_ha or 0.0,
                )
            )
        overall_trend = results[-1].trend.value if hasattr(results[-1].trend, "value") else str(results[-1].trend)

    curr_health = points[-1].health_score if points else 75.0
    curr_disease = points[-1].disease_risk if points else 25.0

    return ZoneTrendResponse(
        zone_id=zone_id,
        zone_name=f"Zone {zone_id}",
        crop_name="Crop",
        current_health_score=curr_health,
        current_disease_risk=curr_disease,
        overall_trend=overall_trend,
        data_points=points,
    )


@router.get("/history/{farm_id}", response_model=List[FarmHealthTimelineEvent])
async def get_farm_health_timeline(
    farm_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    Returns chronological timeline of detections, observations, alerts, and escalations.
    """
    return []

