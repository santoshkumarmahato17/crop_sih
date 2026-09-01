"""
Unit tests for Follow-up Monitoring, Comparison Engine, and Policy Turnaround.
"""

from datetime import datetime, timedelta, timezone
import pytest

from app.models.monitoring import (
    MonitoringPriority,
    MonitoringTrend,
    HotspotTrendStatus,
    MonitoringTriggerType,
    MonitoringMethod,
    MonitoringTaskStatus,
)
from app.services.monitoring_policy import MonitoringPolicyEngine
from app.services.comparison_engine import ComparisonEngine
from app.schemas.monitoring import (
    MonitoringTaskCreate,
    MonitoringResultCreate,
)


def test_priority_from_risk_scores():
    # Critical risk (> 80)
    prio_crit = MonitoringPolicyEngine.calculate_priority_from_risk(disease_risk=85.0)
    assert prio_crit == MonitoringPriority.CRITICAL

    # High risk (65 - 79)
    prio_high = MonitoringPolicyEngine.calculate_priority_from_risk(disease_risk=72.0)
    assert prio_high == MonitoringPriority.HIGH

    # Medium risk (40 - 64)
    prio_med = MonitoringPolicyEngine.calculate_priority_from_risk(disease_risk=52.0)
    assert prio_med == MonitoringPriority.MEDIUM

    # Low risk (< 40)
    prio_low = MonitoringPolicyEngine.calculate_priority_from_risk(disease_risk=25.0)
    assert prio_low == MonitoringPriority.LOW


def test_turnaround_due_date_calculation():
    base_time = datetime(2026, 9, 1, 10, 0, 0, tzinfo=timezone.utc)
    
    # Critical: 24h
    due_crit = MonitoringPolicyEngine.calculate_due_date(MonitoringPriority.CRITICAL, base_time)
    assert due_crit == base_time + timedelta(hours=24)

    # High: 48h
    due_high = MonitoringPolicyEngine.calculate_due_date(MonitoringPriority.HIGH, base_time)
    assert due_high == base_time + timedelta(hours=48)

    # Medium: 4 days
    due_med = MonitoringPolicyEngine.calculate_due_date(MonitoringPriority.MEDIUM, base_time)
    assert due_med == base_time + timedelta(days=4)

    # Low: 7 days
    due_low = MonitoringPolicyEngine.calculate_due_date(MonitoringPriority.LOW, base_time)
    assert due_low == base_time + timedelta(days=7)


def test_targeted_monitoring_envelope():
    envelope = MonitoringPolicyEngine.compute_targeted_envelope(
        primary_zone_name="Z17",
        adjacent_zones=["Z16", "Z18", "Z17"],
    )
    assert "Z17" in envelope
    assert "Z16" in envelope
    assert "Z18" in envelope
    assert len(envelope) == 3


def test_comparison_engine_worsening_and_spreading_scenario():
    """
    Demo Scenario 1:
    Initial: Health: 64, Disease Risk: 78, Area: 1.2 ha
    Follow-up: Health: 58, Disease Risk: 84, Area: 1.8 ha
    Expected: WORSENING, HOTSPOT EXPANDING, ESCALATION REQUIRED
    """
    res = ComparisonEngine.evaluate_comparison(
        prev_health=64.0,
        curr_health=58.0,
        prev_disease=78.0,
        curr_disease=84.0,
        prev_area_ha=1.2,
        curr_area_ha=1.8,
    )

    assert res["health_change"] == -6.0
    assert res["disease_risk_change"] == 6.0
    assert res["affected_area_change_ha"] == 0.6
    assert res["trend"] in [MonitoringTrend.WORSENING, MonitoringTrend.SPREADING]
    assert res["hotspot_status"] == HotspotTrendStatus.EXPANDING
    assert res["is_escalated"] is True
    assert "Critical" in res["escalation_reason"] or "surge" in res["escalation_reason"]


def test_comparison_engine_improving_scenario():
    """
    Demo Scenario 2:
    Initial: Health: 61, Disease Risk: 76, Area: 1.5 ha
    Follow-up: Health: 79, Disease Risk: 41, Area: 0.9 ha
    Expected: IMPROVING, CONTRACTING, NO ESCALATION
    """
    res = ComparisonEngine.evaluate_comparison(
        prev_health=61.0,
        curr_health=79.0,
        prev_disease=76.0,
        curr_disease=41.0,
        prev_area_ha=1.5,
        curr_area_ha=0.9,
    )

    assert res["health_change"] == 18.0
    assert res["disease_risk_change"] == -35.0
    assert res["affected_area_change_ha"] == -0.6
    assert res["trend"] == MonitoringTrend.IMPROVING
    assert res["hotspot_status"] == HotspotTrendStatus.CONTRACTING
    assert res["is_escalated"] is False


def test_comparison_engine_stable_scenario():
    res = ComparisonEngine.evaluate_comparison(
        prev_health=75.0,
        curr_health=74.0,
        prev_disease=45.0,
        curr_disease=46.0,
        prev_area_ha=0.8,
        curr_area_ha=0.8,
    )

    assert res["trend"] == MonitoringTrend.STABLE
    assert res["hotspot_status"] == HotspotTrendStatus.STABLE
    assert res["is_escalated"] is False


def test_monitoring_schemas():
    task_in = MonitoringTaskCreate(
        farm_id="farm-001",
        zone_id="zone-017",
        trigger_type=MonitoringTriggerType.HOTSPOT,
        priority=MonitoringPriority.HIGH,
        monitoring_method=MonitoringMethod.DRONE,
        suspected_condition="Early Blight",
        baseline_health_score=64.0,
        baseline_disease_risk=78.0,
    )
    assert task_in.farm_id == "farm-001"
    assert task_in.priority == MonitoringPriority.HIGH

    res_in = MonitoringResultCreate(
        health_score=58.0,
        disease_risk=84.0,
        affected_area_ha=1.8,
        severity="HIGH",
        observed_symptoms=["Concentric foliar spots", "Defoliation"],
    )
    assert res_in.health_score == 58.0
    assert res_in.disease_risk == 84.0
