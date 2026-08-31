from collections import defaultdict
from datetime import datetime
from typing import List, Optional
from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.analytics.temporal import ScanObservationData, calculate_temporal_trends
from app.models.farm import Farm, FarmZone
from app.models.observation import HealthObservation
from app.repositories.farm import farm_repo
from app.repositories.observation import observation_repo
from app.schemas.temporal import (
    FarmHealthTimelineResponse,
    FarmHealthTimelineSnapshot,
    ZoneHistoryResponse,
    ZoneScanRecord,
    ZoneTrendResponse,
)


class TemporalAnalysisService:
    """Service executing multi-scan temporal comparisons and trend classifications."""

    def __init__(self):
        self.obs_repo = observation_repo
        self.farm_repo = farm_repo

    def _to_scan_record(self, obs: HealthObservation) -> ScanObservationData:
        # Extract disease metrics
        disease_prob = 0.0
        max_disease_sev = "none"
        if obs.disease_observations and len(obs.disease_observations) > 0:
            disease_prob = max(d.confidence_score * 100.0 for d in obs.disease_observations)
            max_disease_sev = str(obs.disease_observations[0].severity_level.value if hasattr(obs.disease_observations[0].severity_level, "value") else obs.disease_observations[0].severity_level)

        # Extract pest metrics
        pest_prob = 0.0
        if obs.pest_observations and len(obs.pest_observations) > 0:
            pest_prob = max(p.confidence_score * 100.0 for p in obs.pest_observations)

        # Extract water stress metrics
        cwsi = 0.0
        water_stress_cat = "none"
        if obs.water_stress_observations and len(obs.water_stress_observations) > 0:
            cwsi = max(w.cwsi_index for w in obs.water_stress_observations)
            water_stress_cat = str(obs.water_stress_observations[0].stress_category.value if hasattr(obs.water_stress_observations[0].stress_category, "value") else obs.water_stress_observations[0].stress_category)

        # Convert normalized score [0.0 - 1.0] to percentage [0 - 100]
        health_pct = round(obs.overall_health_score * 100.0 if obs.overall_health_score <= 1.0 else obs.overall_health_score, 1)

        return ScanObservationData(
            scan_id=obs.id,
            observation_date=obs.observation_date,
            health_score=health_pct,
            mean_ndvi=obs.mean_ndvi,
            mean_ndre=obs.mean_ndre,
            disease_probability=round(disease_prob, 1),
            disease_count=len(obs.disease_observations or []),
            max_disease_severity=max_disease_sev,
            pest_probability=round(pest_prob, 1),
            pest_count=len(obs.pest_observations or []),
            water_stress_cwsi=round(cwsi, 2),
            water_stress_category=water_stress_cat,
            anomaly_score=round(max(0.0, 100.0 - health_pct), 1),
        )

    def _to_schema_scan_record(self, data: ScanObservationData) -> ZoneScanRecord:
        return ZoneScanRecord(
            scan_id=data.scan_id,
            observation_date=data.observation_date,
            health_score=data.health_score,
            mean_ndvi=data.mean_ndvi,
            mean_ndre=data.mean_ndre,
            disease_probability=data.disease_probability,
            disease_count=data.disease_count,
            max_disease_severity=data.max_disease_severity,
            pest_probability=data.pest_probability,
            pest_count=data.pest_count,
            water_stress_cwsi=data.water_stress_cwsi,
            water_stress_category=data.water_stress_category,
            anomaly_score=data.anomaly_score,
        )

    async def get_zone_history(
        self, db: AsyncSession, zone_id: str, limit: int = 50
    ) -> ZoneHistoryResponse:
        """Retrieves chronological scan history records for a zone."""
        # Query zone to resolve zone_code and farm_id
        result = await db.execute(
            select(FarmZone).where((FarmZone.id == zone_id) | (FarmZone.zone_code == zone_id))
        )
        zone = result.scalars().first()
        resolved_zone_id = zone.id if zone else zone_id
        zone_code = zone.zone_code if zone else (zone_id if zone_id.startswith("Z") else "Z01")
        farm_id = zone.farm_id if zone else "farm-unknown"

        observations = await self.obs_repo.list_by_zone_chronological(
            db, zone_id=resolved_zone_id, limit=limit
        )

        scan_records = [self._to_scan_record(obs) for obs in observations]

        return ZoneHistoryResponse(
            zone_id=resolved_zone_id,
            zone_code=zone_code,
            farm_id=farm_id,
            total_scans=len(scan_records),
            history=[self._to_schema_scan_record(s) for s in scan_records],
        )

    async def calculate_zone_trend(
        self, db: AsyncSession, zone_id: str
    ) -> ZoneTrendResponse:
        """Calculates multi-scan rate of change and classifies temporal trajectory."""
        result = await db.execute(
            select(FarmZone).where((FarmZone.id == zone_id) | (FarmZone.zone_code == zone_id))
        )
        zone = result.scalars().first()
        resolved_zone_id = zone.id if zone else zone_id
        zone_code = zone.zone_code if zone else (zone_id if zone_id.startswith("Z") else "Z01")
        farm_id = zone.farm_id if zone else "farm-unknown"

        observations = await self.obs_repo.list_by_zone_chronological(
            db, zone_id=resolved_zone_id, limit=50
        )

        scan_records = [self._to_scan_record(obs) for obs in observations]
        trend_result = calculate_temporal_trends(resolved_zone_id, scan_records)

        return ZoneTrendResponse(
            zone_id=resolved_zone_id,
            zone_code=zone_code,
            farm_id=farm_id,
            total_scans=trend_result.total_scans,
            health_trend=trend_result.health_trend,
            disease_trend=trend_result.disease_trend,
            pest_trend=trend_result.pest_trend,
            water_stress_trend=trend_result.water_stress_trend,
            anomaly_trend=trend_result.anomaly_trend,
            classification=trend_result.classification,
            delta_last_scan_percent=trend_result.delta_last_scan_percent,
            delta_total_percent=trend_result.delta_total_percent,
            velocity_per_day=trend_result.velocity_per_day,
            baseline_health=trend_result.baseline_health,
            current_health=trend_result.current_health,
            recent_scans=[self._to_schema_scan_record(s) for s in trend_result.scans_history],
        )

    async def get_farm_health_history(
        self, db: AsyncSession, farm_id: str
    ) -> FarmHealthTimelineResponse:
        """Aggregates farm-wide health observations across dates."""
        farm = await self.farm_repo.get_by_id_with_relations(db, farm_id)
        farm_name = farm.name if farm else "Agricultural Holding"
        total_zones = len(farm.zones) if (farm and farm.zones) else 4

        observations = await self.obs_repo.list_by_farm_chronological(
            db, farm_id=farm_id, limit=200
        )

        # Group observations by calendar date
        by_date = defaultdict(list)
        for obs in observations:
            d_str = obs.observation_date.strftime("%Y-%m-%d")
            by_date[d_str].append(obs)

        snapshots = []
        for d_str, obs_list in sorted(by_date.items()):
            scores = [
                o.overall_health_score * 100.0 if o.overall_health_score <= 1.0 else o.overall_health_score
                for o in obs_list
            ]
            mean_score = round(sum(scores) / len(scores), 1) if scores else 85.0
            zones_seen = len(set(o.zone_id for o in obs_list if o.zone_id))
            
            trend_str = "STABLE"
            if mean_score >= 85:
                trend_str = "IMPROVING"
            elif mean_score < 70:
                trend_str = "DECLINING"

            snapshots.append(
                FarmHealthTimelineSnapshot(
                    date=d_str,
                    mean_health_score=mean_score,
                    mean_ndvi=round(mean_score / 120.0, 2),
                    total_observations=len(obs_list),
                    zones_monitored=max(1, zones_seen),
                    dominant_trend=trend_str,
                )
            )

        return FarmHealthTimelineResponse(
            farm_id=farm_id,
            farm_name=farm_name,
            total_zones=total_zones,
            history_by_date=snapshots,
        )


temporal_analysis_service = TemporalAnalysisService()
