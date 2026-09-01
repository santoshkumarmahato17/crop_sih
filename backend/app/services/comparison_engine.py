"""
AGRI SHIELD — Closed-Loop Before vs After Comparison & Health Trend Engine.
Performs quantitative delta analysis, trend categorization, hotspot evolution tracking,
and escalation triggers.
"""

from typing import Dict, Any, Optional
from app.models.monitoring import (
    MonitoringTrend,
    HotspotTrendStatus,
)


class ComparisonEngine:
    """Quantitative before-vs-after comparison and closed-loop feedback engine."""

    @staticmethod
    def evaluate_comparison(
        prev_health: float,
        curr_health: float,
        prev_disease: float,
        curr_disease: float,
        prev_area_ha: float = 0.0,
        curr_area_ha: float = 0.0,
        adjacent_zones_affected: bool = False,
    ) -> Dict[str, Any]:
        """
        Compares baseline/previous observation against new follow-up observation.
        """
        health_change = round(curr_health - prev_health, 2)
        disease_change = round(curr_disease - prev_disease, 2)
        area_change = round(curr_area_ha - prev_area_ha, 2)

        # 1. Holistic Trend Categorization
        if adjacent_zones_affected or (area_change >= 0.3 and disease_change >= 5.0):
            trend = MonitoringTrend.SPREADING
        elif health_change >= 5.0 and disease_change <= -5.0:
            trend = MonitoringTrend.IMPROVING
        elif abs(health_change) < 5.0 and abs(disease_change) < 5.0:
            trend = MonitoringTrend.STABLE
        elif health_change < -5.0 or disease_change > 5.0:
            trend = MonitoringTrend.WORSENING
        else:
            trend = MonitoringTrend.UNCERTAIN

        # 2. Hotspot Evolution Analysis
        if prev_disease >= 55.0 and curr_disease < 30.0:
            hotspot_status = HotspotTrendStatus.RESOLVED
        elif area_change >= 0.2 or disease_change >= 8.0 or adjacent_zones_affected:
            hotspot_status = HotspotTrendStatus.EXPANDING
        elif area_change <= -0.2 or disease_change <= -8.0:
            hotspot_status = HotspotTrendStatus.CONTRACTING
        else:
            hotspot_status = HotspotTrendStatus.STABLE

        # 3. Escalation Gate Check
        is_escalated = False
        escalation_reason = None
        recommended_action = None

        if curr_disease >= 80.0 or curr_health <= 50.0:
            is_escalated = True
            escalation_reason = (
                f"Critical pathology surge detected (Disease Risk: {curr_disease}%, Health Score: {curr_health})."
            )
            recommended_action = "Immediate agricultural extension specialist review and targeted field inspection."
        elif trend == MonitoringTrend.SPREADING:
            is_escalated = True
            escalation_reason = (
                f"Hotspot containment breached with +{area_change} ha affected area spread into adjacent blocks."
            )
            recommended_action = "Establish 200m buffer zone containment and dispatch targeted drone re-scan."
        elif trend == MonitoringTrend.WORSENING and health_change <= -10.0:
            is_escalated = True
            escalation_reason = (
                f"Rapid crop-health deterioration ({health_change} pts drop in canopy vigor index)."
            )
            recommended_action = "Escalate to regional pathologist and inspect root-zone soil core samples."
        elif trend == MonitoringTrend.IMPROVING:
            recommended_action = "Crop-health indicators are improving. Continue routine scheduled monitoring."
        else:
            recommended_action = "Crop-health indicators remain stable. Continue scheduled monitoring."

        return {
            "health_change": health_change,
            "disease_risk_change": disease_change,
            "affected_area_change_ha": area_change,
            "trend": trend,
            "hotspot_status": hotspot_status,
            "is_escalated": is_escalated,
            "escalation_reason": escalation_reason,
            "recommended_action": recommended_action,
        }
