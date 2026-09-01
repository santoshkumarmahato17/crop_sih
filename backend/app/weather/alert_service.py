from datetime import datetime, timedelta, timezone
from typing import Dict, List, Optional
import uuid
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.alert import Alert, AlertSeverity, AlertType
from app.models.farm import Farm
from app.weather.risk_engines import FullWeatherRiskAssessment, RiskTier


class WeatherAlertService:
    """Manages threshold-crossing alert generation with stateful deduplication and adaptive monitoring dispatch."""

    def __init__(self):
        # In-memory deduplication cache: (farm_id, zone_id, risk_type) -> (last_tier, last_alerted_at)
        self._dedup_cache: Dict[str, tuple[str, datetime]] = {}

    def _get_cache_key(self, farm_id: str, zone_id: Optional[str], risk_type: str) -> str:
        return f"{farm_id}:{zone_id or 'farm'}:{risk_type}"

    async def check_and_generate_alerts(
        self,
        db: AsyncSession,
        assessment: FullWeatherRiskAssessment,
        user_id: Optional[str] = None,
    ) -> List[Alert]:
        alerts_created: List[Alert] = []
        now = datetime.now(timezone.utc)

        # Check vectors: Disease, Pest, Water Stress, Overall Forecast Escalation
        vectors = [
            ("DISEASE", assessment.current_disease_risk.score, assessment.current_disease_risk.tier, assessment.current_disease_risk.plain_explanation),
            ("PEST", assessment.current_pest_risk.score, assessment.current_pest_risk.tier, assessment.current_pest_risk.plain_explanation),
        ]

        # Check if 3-day forecast escalates to CRITICAL
        max_future_score = max([item.overall_risk_score for item in assessment.forecast_timeline[:4]], default=assessment.current_overall_risk.score)
        if max_future_score >= 75 and assessment.current_overall_risk.tier != RiskTier.CRITICAL.value:
            vectors.append(
                (
                    "FORECAST_ESCALATION",
                    max_future_score,
                    RiskTier.CRITICAL.value,
                    f"Weather forecast models project risk escalation to CRITICAL ({max_future_score}/100) within 72 hours. Early preventive bio-treatment advised.",
                )
            )

        for r_type, score, tier, explanation in vectors:
            if tier not in [RiskTier.HIGH.value, RiskTier.CRITICAL.value]:
                continue

            cache_key = self._get_cache_key(assessment.farm_id, assessment.zone_id, r_type)
            last_record = self._dedup_cache.get(cache_key)

            # Deduplication Rule: If alerted within last 24h at same or higher tier, suppress duplicate
            if last_record:
                last_tier, last_time = last_record
                if (now - last_time) < timedelta(hours=24) and (last_tier == tier or (last_tier == "CRITICAL" and tier == "HIGH")):
                    continue

            # Map to AlertSeverity
            severity = AlertSeverity.CRITICAL if tier == RiskTier.CRITICAL.value else AlertSeverity.HIGH
            alert_type = AlertType.DISEASE_OUTBREAK if r_type == "DISEASE" else AlertType.PEST_SURGE if r_type == "PEST" else AlertType.SYSTEM_ABNORMALITY

            zone_str = f"Zone {assessment.zone_id}" if assessment.zone_id else "Farm Boundary"
            title = f"Elevated {r_type.replace('_', ' ').title()} Risk Alert — {zone_str}"

            alert = Alert(
                id=str(uuid.uuid4()),
                farm_id=assessment.farm_id,
                zone_id=assessment.zone_id,
                alert_type=alert_type,
                severity=severity,
                title=title,
                message=explanation,
                recommended_action=assessment.adaptive_monitoring_recommendation,
                is_acknowledged=False,
                created_at=now,
            )

            try:
                db.add(alert)
                await db.commit()
                alerts_created.append(alert)
                self._dedup_cache[cache_key] = (tier, now)
            except Exception:
                await db.rollback()

        return alerts_created


weather_alert_service = WeatherAlertService()
