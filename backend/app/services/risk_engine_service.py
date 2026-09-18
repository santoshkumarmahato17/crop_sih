import uuid
from datetime import datetime, timezone
from typing import Dict, List, Optional
from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.analytics.risk_engine import (
    ContributingFactor,
    ExplainableRiskResult,
    RiskEngineInputs,
    evaluate_crop_health_risk,
)
from app.core.logging import logger
from app.models.farm import Farm, FarmZone
from app.models.intelligence import RiskAssessment, RiskLevel
from app.repositories.farm import farm_repo
from app.repositories.observation import observation_repo
from app.schemas.risk import (
    FarmRiskSummaryResponse,
    RiskAssessmentDetail,
    RiskContributingFactor,
    ZoneRiskResponse,
)
from app.models.sensor import PestTrapObservation, FieldSensorReading, SensorType


class RiskEngineService:
    """Service managing explainable risk calculations and PostGIS persistence."""

    def __init__(self):
        self.farm_repo = farm_repo
        self.obs_repo = observation_repo

    def _to_schema_detail(self, result: ExplainableRiskResult) -> RiskAssessmentDetail:
        return RiskAssessmentDetail(
            disease_risk_score=result.disease_risk_score,
            pest_risk_score=result.pest_risk_score,
            water_stress_risk=result.water_stress_risk,
            overall_crop_risk=result.overall_crop_risk,
            risk_level=result.risk_level,
            rule_version=result.rule_version,
            assessment_timestamp=result.assessment_timestamp,
            explanation_summary=result.explanation_summary,
            contributing_factors=[
                RiskContributingFactor(
                    factor_name=f.factor_name,
                    category=f.category,
                    points=f.points,
                    description=f.description,
                )
                for f in result.contributing_factors
            ],
            raw_inputs=result.raw_inputs,
        )

    async def evaluate_zone_risk(
        self,
        db: AsyncSession,
        zone_id: str,
        farm_id: Optional[str] = None,
        custom_inputs: Optional[RiskEngineInputs] = None,
    ) -> ZoneRiskResponse:
        """Evaluates explainable risk for a zone and updates zone risk status in DB."""
        result = await db.execute(
            select(FarmZone).where((FarmZone.id == zone_id) | (FarmZone.zone_code == zone_id))
        )
        zone = result.scalars().first()
        resolved_zone_id = zone.id if zone else zone_id
        zone_code = zone.zone_code if zone else (zone_id if zone_id.startswith("Z") else "Z01")
        farm_id = (zone.farm_id if zone else None) or farm_id or "farm-default"

        # Build risk engine inputs from real observation history if available
        if custom_inputs:
            inputs = custom_inputs
        else:
            observations = await self.obs_repo.list_by_zone_chronological(db, resolved_zone_id, limit=5)
            latest_health = 75.0
            trend_str = "STABLE"
            has_disease = False
            cwsi = 0.25

            if observations:
                latest_health = (
                    observations[-1].overall_health_score * 100.0
                    if observations[-1].overall_health_score <= 1.0
                    else observations[-1].overall_health_score
                )
                if len(observations) >= 2:
                    diff = latest_health - (
                        observations[0].overall_health_score * 100.0
                        if observations[0].overall_health_score <= 1.0
                        else observations[0].overall_health_score
                    )
                    trend_str = "DECLINING" if diff <= -5.0 else ("IMPROVING" if diff >= 5.0 else "STABLE")
                has_disease = any(len(o.disease_observations or []) > 0 for o in observations)

            # Fetch real weather based on fallback coordinates (approx. Maharashtra region)
            # Ideally extract from zone.farm.center_point when PostGIS is fully populated
            lat, lon = 20.0, 73.78
            
            from app.weather.providers.service import get_current_weather, get_historical_weather
            from app.weather.providers.base import DataQuality
            
            rel_humidity = 82.0
            temp_c = 27.5
            recent_rainfall = 18.0
            
            try:
                # Real weather integration as per user request
                current_weather = await get_current_weather(lat, lon)
                hist_weather = await get_historical_weather(lat, lon, days_back=7)
                
                # Apply weather only if it meets data quality threshold
                if current_weather.data_quality in (DataQuality.GOOD, DataQuality.STALE):
                    if current_weather.relative_humidity_percent is not None:
                        rel_humidity = current_weather.relative_humidity_percent
                    if current_weather.temperature_c is not None:
                        temp_c = current_weather.temperature_c
                
                # Aggregate historical rainfall
                if hist_weather:
                    recent_rainfall = sum(w.rainfall_mm or 0.0 for w in hist_weather)
            except Exception as e:
                logger.error(f"Failed to fetch real weather for risk engine: {e}")

            # --- Fetch latest Pest Trap count ---
            trap_res = await db.execute(
                select(PestTrapObservation)
                .where(PestTrapObservation.zone_id == resolved_zone_id)
                .order_by(PestTrapObservation.observation_time.desc())
                .limit(1)
            )
            latest_trap = trap_res.scalars().first()
            trap_count = latest_trap.count if latest_trap else None

            # --- Fetch latest Soil Moisture reading ---
            sensor_res = await db.execute(
                select(FieldSensorReading)
                .where(
                    FieldSensorReading.zone_id == resolved_zone_id,
                    FieldSensorReading.sensor_type == SensorType.SOIL_MOISTURE
                )
                .order_by(FieldSensorReading.timestamp.desc())
                .limit(1)
            )
            latest_soil = sensor_res.scalars().first()
            soil_moisture = latest_soil.measurement if latest_soil else None

            inputs = RiskEngineInputs(
                crop_type="Wheat",
                growth_stage="Grain Filling",
                relative_humidity_pct=rel_humidity,
                recent_rainfall_mm=recent_rainfall,
                temperature_c=temp_c,
                current_health_score=latest_health,
                health_trend=trend_str,
                has_disease_history=has_disease,
                has_pest_history=False,
                nearby_disease_activity_km=4.2,
                cwsi_water_stress=cwsi,
                recent_pest_trap_count=trap_count,
                recent_soil_moisture_pct=soil_moisture,
            )

        # Run Explainable Risk Evaluation
        eval_result = evaluate_crop_health_risk(resolved_zone_id, inputs)

        # Map Risk Level to DB Enum
        db_risk_map = {
            "LOW": RiskLevel.LOW,
            "MEDIUM": RiskLevel.MEDIUM,
            "HIGH": RiskLevel.HIGH,
            "CRITICAL": RiskLevel.SEVERE,
        }
        db_level = db_risk_map.get(eval_result.risk_level, RiskLevel.MEDIUM)

        # Persist RiskAssessment Record in PostGIS DB
        risk_record = RiskAssessment(
            id=str(uuid.uuid4()),
            farm_id=farm_id,
            zone_id=resolved_zone_id,
            assessment_date=eval_result.assessment_timestamp,
            target_pathogen_or_pest="Multi-Vector Crop Health Risk Assessment",
            risk_score=round(eval_result.overall_crop_risk / 100.0, 2),
            risk_level=db_level,
            driving_factors={
                "disease_risk": eval_result.disease_risk_score,
                "pest_risk": eval_result.pest_risk_score,
                "water_stress_risk": eval_result.water_stress_risk,
                "overall_crop_risk": eval_result.overall_crop_risk,
                "factors": [f.__dict__ for f in eval_result.contributing_factors],
            },
            forecast_window_days=7,
        )
        db.add(risk_record)

        # Update Zone Risk Status on Map
        if zone:
            zone_status_map = {
                "LOW": "low",
                "MEDIUM": "moderate",
                "HIGH": "high",
                "CRITICAL": "critical",
            }
            zone.risk_status = zone_status_map.get(eval_result.risk_level, "moderate")
            db.add(zone)

        await db.commit()
        logger.info(
            f"Evaluated explainable risk for zone {zone_code}: "
            f"Score {eval_result.overall_crop_risk} ({eval_result.risk_level})."
        )

        return ZoneRiskResponse(
            zone_id=resolved_zone_id,
            zone_code=zone_code,
            farm_id=farm_id,
            risk_assessment=self._to_schema_detail(eval_result),
        )

    async def get_zone_risk(self, db: AsyncSession, zone_id: str) -> ZoneRiskResponse:
        """Retrieves or calculates latest explainable risk for a zone."""
        return await self.evaluate_zone_risk(db, zone_id=zone_id)

    async def evaluate_farm_risk(
        self, db: AsyncSession, farm_id: str
    ) -> FarmRiskSummaryResponse:
        """Evaluates explainable risk across all zones of a farm."""
        farm = await self.farm_repo.get_by_id_with_relations(db, farm_id)
        farm_name = farm.name if farm else "Agricultural Holding"
        zones = farm.zones if (farm and farm.zones) else []

        zone_responses = []
        if zones:
            for z in zones:
                zr = await self.evaluate_zone_risk(db, zone_id=z.id, farm_id=farm_id)
                zone_responses.append(zr)
        else:
            # Fallback demo zones
            for z_code in ["Z01", "Z02", "Z03", "Z04"]:
                zr = await self.evaluate_zone_risk(db, zone_id=f"zone-{z_code.lower()}", farm_id=farm_id)
                zone_responses.append(zr)

        scores = [zr.risk_assessment.overall_crop_risk for zr in zone_responses]
        mean_score = round(sum(scores) / len(scores), 1) if scores else 45.0
        crit_count = sum(1 for zr in zone_responses if zr.risk_assessment.risk_level in ["HIGH", "CRITICAL"])

        highest_level = "LOW"
        if any(zr.risk_assessment.risk_level == "CRITICAL" for zr in zone_responses):
            highest_level = "CRITICAL"
        elif any(zr.risk_assessment.risk_level == "HIGH" for zr in zone_responses):
            highest_level = "HIGH"
        elif any(zr.risk_assessment.risk_level == "MEDIUM" for zr in zone_responses):
            highest_level = "MEDIUM"

        return FarmRiskSummaryResponse(
            farm_id=farm_id,
            farm_name=farm_name,
            mean_overall_risk=mean_score,
            highest_risk_level=highest_level,
            critical_zones_count=crit_count,
            evaluated_at=datetime.now(timezone.utc),
            zones_risk=zone_responses,
        )


risk_engine_service = RiskEngineService()
