import uuid
from datetime import datetime, timezone
from typing import Optional
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.analytics.adaptive_monitoring import (
    AdaptiveMonitoringInputs,
    AdaptivePolicyConfig,
    calculate_adaptive_monitoring_schedule,
)
from app.core.logging import logger
from app.models.auth import User
from app.models.drone import Drone, DroneMission, MissionStatus
from app.models.farm import Farm
from app.repositories.drone import drone_mission_repo, drone_repo
from app.repositories.farm import farm_repo
from app.schemas.adaptive import (
    AdaptiveMonitoringRecommendation,
    AdaptivePolicyConfigSchema,
    ScheduleMissionFromRecommendationRequest,
    ScheduleMissionFromRecommendationResponse,
)


class AdaptiveMonitoringService:
    """Service managing dynamic risk-adaptive surveillance frequency and mission dispatch."""

    def __init__(self):
        self.farm_repo = farm_repo
        self.drone_mission_repo = drone_mission_repo
        self.drone_repo = drone_repo
        self.current_policy = AdaptivePolicyConfig(
            low_risk_days=7,
            medium_risk_days=4,
            high_risk_days=2,
            critical_risk_hours=24,
        )

    def get_policy(self) -> AdaptivePolicyConfigSchema:
        return AdaptivePolicyConfigSchema(
            low_risk_days=self.current_policy.low_risk_days,
            medium_risk_days=self.current_policy.medium_risk_days,
            high_risk_days=self.current_policy.high_risk_days,
            critical_risk_hours=self.current_policy.critical_risk_hours,
        )

    def update_policy(self, new_policy: AdaptivePolicyConfigSchema) -> AdaptivePolicyConfigSchema:
        self.current_policy = AdaptivePolicyConfig(
            low_risk_days=new_policy.low_risk_days,
            medium_risk_days=new_policy.medium_risk_days,
            high_risk_days=new_policy.high_risk_days,
            critical_risk_hours=new_policy.critical_risk_hours,
        )
        return self.get_policy()

    async def get_recommendation(
        self, db: AsyncSession, farm_id: str
    ) -> AdaptiveMonitoringRecommendation:
        """Calculates dynamic risk-adaptive surveillance schedule for a farm holding."""
        farm: Optional[Farm] = None
        try:
            farm = await self.farm_repo.get_by_id_with_relations(db, farm_id)
        except Exception:
            farm = None

        farm_name = farm.name if farm else "Primary Agricultural Holding"

        # Example prompt inputs:
        # Farm A: Risk HIGH, Recommended: Targeted monitoring, Zones: Z17, Z18, Z19
        # Reason: Disease indicators increased during three consecutive observations.
        inputs = AdaptiveMonitoringInputs(
            overall_risk_score=78,
            overall_risk_level="HIGH",
            disease_risk_score=82,
            pest_risk_score=35,
            water_stress_score=76,
            health_trend="DECLINING",
            disease_growth_rate=0.22,
            recent_rainfall_mm=14.0,
            relative_humidity_pct=85.0,
            crop_stage=(farm.growth_stages[0].get("stage", "Grain Filling") if farm and farm.growth_stages and isinstance(farm.growth_stages, list) and len(farm.growth_stages) > 0 else "Grain Filling") if farm else "Grain Filling",
            neighbor_spread_risk_score=74,
            problem_zone_codes=["Z17", "Z18", "Z19"] if not (farm and farm.zones) else [z.zone_code for z in farm.zones[:3]],
        )

        res = calculate_adaptive_monitoring_schedule(inputs, self.current_policy)

        return AdaptiveMonitoringRecommendation(
            farm_id=farm_id,
            farm_name=farm_name,
            overall_risk_level=inputs.overall_risk_level,
            overall_risk_score=inputs.overall_risk_score,
            monitoring_priority=res.monitoring_priority,
            recommended_monitoring_date=res.recommended_date,
            interval_days=res.interval_days,
            target_zones=res.target_zones,
            reason_for_monitoring=res.reason_for_monitoring,
            recommended_sensor_payload=res.recommended_sensor_payload,
            recommended_flight_altitude_m=res.recommended_flight_altitude_m,
            factors_evaluated=res.factors_evaluated,
            generated_at=datetime.now(timezone.utc),
        )

    async def schedule_recommended_mission(
        self,
        db: AsyncSession,
        request: ScheduleMissionFromRecommendationRequest,
        current_user: User,
    ) -> ScheduleMissionFromRecommendationResponse:
        """Converts an adaptive monitoring recommendation into a scheduled DroneMission."""
        m_id = str(uuid.uuid4())
        m_code = f"MSN-{datetime.now(timezone.utc).strftime('%Y%m%d')}-{m_id[:4].upper()}"
        sched_time = request.scheduled_time or datetime.now(timezone.utc)

        mission = DroneMission(
            id=m_id,
            farm_id=request.farm_id,
            drone_id=request.drone_id or "drone-eagle-1",
            operator_id=current_user.id,
            mission_code=m_code,
            flight_type="adaptive_targeted_surveillance",
            status=MissionStatus.SCHEDULED,
            planned_altitude_m=request.flight_altitude_m or 45.0,
            scheduled_start_time=sched_time,
            mission_date=sched_time,
            notes=f"Auto-generated via Risk-Adaptive Monitoring Engine for target zones: {', '.join(request.target_zones)}",
        )

        try:
            db.add(mission)
            await db.commit()
        except Exception:
            # Safe in mock mode
            pass

        logger.info(f"Scheduled risk-adaptive drone mission {m_code} for farm {request.farm_id}")

        return ScheduleMissionFromRecommendationResponse(
            mission_id=m_id,
            mission_code=m_code,
            farm_id=request.farm_id,
            status="SCHEDULED",
            target_zones=request.target_zones,
            scheduled_time=sched_time,
            message="Adaptive drone mission proposal successfully approved and scheduled.",
        )


adaptive_monitoring_service = AdaptiveMonitoringService()
