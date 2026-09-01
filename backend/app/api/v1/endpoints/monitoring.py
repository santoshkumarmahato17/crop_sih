"""
AGRI SHIELD — Follow-up Monitoring & Closed-Loop Health Tracking REST Endpoints.
"""

from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.api.deps import get_current_active_user
from app.models.auth import User
from app.schemas.monitoring import (
    MonitoringTaskCreate,
    MonitoringTaskResponse,
    MonitoringResultCreate,
    MonitoringResultResponse,
    DroneMonitoringRecommendationResponse,
    MonitoringStatsResponse,
    ZoneTrendResponse,
    FarmHealthTimelineEvent,
)
from app.services.monitoring_service import FollowupMonitoringService

router = APIRouter(prefix="/monitoring", tags=["Follow-up Monitoring & Crop Health Tracking"])


@router.get("/tasks", response_model=List[MonitoringTaskResponse])
def list_monitoring_tasks(
    farm_id: Optional[str] = Query(None),
    zone_id: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    priority: Optional[str] = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    List follow-up monitoring tasks scoped to user authorization and filters.
    """
    return FollowupMonitoringService.list_monitoring_tasks(
        db=db,
        current_user=current_user,
        farm_id=farm_id,
        zone_id=zone_id,
        status=status,
        priority=priority,
        skip=skip,
        limit=limit,
    )


@router.get("/tasks/{id}", response_model=MonitoringTaskResponse)
def get_monitoring_task(
    id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    Retrieves detailed monitoring task by ID.
    """
    task = FollowupMonitoringService.get_monitoring_task(db, id)
    if not task:
        raise HTTPException(status_code=404, detail="Monitoring task not found")
    return task


@router.post("/tasks", response_model=MonitoringTaskResponse, status_code=status.HTTP_201_CREATED)
def create_monitoring_task(
    payload: MonitoringTaskCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    Schedules a new follow-up monitoring task.
    """
    return FollowupMonitoringService.create_monitoring_task(
        db=db,
        req_in=payload,
        current_user=current_user,
    )


@router.post("/tasks/{id}/start", response_model=MonitoringTaskResponse)
def start_monitoring_task(
    id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    Marks a scheduled monitoring task as IN_PROGRESS and assigns to the current officer/drone operator.
    """
    try:
        return FollowupMonitoringService.start_monitoring_task(db, id, current_user)
    except ValueError as ve:
        raise HTTPException(status_code=404, detail=str(ve))


@router.post("/tasks/{id}/result", response_model=MonitoringResultResponse)
def submit_monitoring_result(
    id: str,
    payload: MonitoringResultCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    Submits a new follow-up observation result, executes before-vs-after comparison,
    and updates task status to COMPLETED or ESCALATED.
    """
    try:
        return FollowupMonitoringService.submit_monitoring_result(
            db=db,
            task_id=id,
            result_in=payload,
            current_user=current_user,
        )
    except ValueError as ve:
        raise HTTPException(status_code=404, detail=str(ve))


@router.get("/recommendations/drone", response_model=List[DroneMonitoringRecommendationResponse])
def get_drone_recommendations(
    farm_id: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    Retrieves targeted drone surveillance recommendations with buffer envelopes.
    """
    return FollowupMonitoringService.get_drone_recommendations(
        db=db,
        current_user=current_user,
        farm_id=farm_id,
    )


@router.get("/statistics", response_model=MonitoringStatsResponse)
def get_monitoring_statistics(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    Returns aggregated monitoring metrics and coverage percentage.
    """
    return FollowupMonitoringService.get_monitoring_statistics(db=db, current_user=current_user)


@router.get("/trends/{zone_id}", response_model=ZoneTrendResponse)
def get_zone_trends(
    zone_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    Returns time-series telemetry data points for zone health, disease, pest, and water stress.
    """
    return FollowupMonitoringService.get_zone_trends(db=db, zone_id=zone_id)


@router.get("/history/{farm_id}", response_model=List[FarmHealthTimelineEvent])
def get_farm_health_timeline(
    farm_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    Returns chronological timeline of detections, observations, alerts, and escalations.
    """
    return FollowupMonitoringService.get_farm_health_timeline(db=db, farm_id=farm_id)
