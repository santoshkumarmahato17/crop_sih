from datetime import datetime, timedelta, timezone
import pytest

from app.analytics.temporal import ScanObservationData, calculate_temporal_trends


def test_rapidly_declining_trajectory():
    """
    Test user prompt example:
    Scan 1: Health = 92
    Scan 2: Health = 86
    Scan 3: Health = 74
    Scan 4: Health = 61
    Must classify as RAPIDLY_DECLINING.
    """
    base_time = datetime(2026, 8, 1, 10, 0, tzinfo=timezone.utc)
    scans = [
        ScanObservationData(
            scan_id="scan-1",
            observation_date=base_time,
            health_score=92.0,
            disease_probability=5.0,
            water_stress_cwsi=0.10,
        ),
        ScanObservationData(
            scan_id="scan-2",
            observation_date=base_time + timedelta(days=3),
            health_score=86.0,
            disease_probability=12.0,
            water_stress_cwsi=0.25,
        ),
        ScanObservationData(
            scan_id="scan-3",
            observation_date=base_time + timedelta(days=6),
            health_score=74.0,
            disease_probability=35.0,
            water_stress_cwsi=0.45,
        ),
        ScanObservationData(
            scan_id="scan-4",
            observation_date=base_time + timedelta(days=9),
            health_score=61.0,
            disease_probability=65.0,
            water_stress_cwsi=0.70,
        ),
    ]

    result = calculate_temporal_trends("zone-17", scans)

    assert result.total_scans == 4
    assert result.classification == "RAPIDLY_DECLINING"
    assert result.health_trend == "RAPIDLY_DECLINING"
    assert result.delta_total_percent == -31.0
    assert result.delta_last_scan_percent == -13.0
    assert result.disease_trend == "SURGING"
    assert result.water_stress_trend == "CRITICAL"
    assert result.baseline_health == 92.0
    assert result.current_health == 61.0


def test_improving_trajectory():
    """Test recovery trajectory (e.g. 60 -> 75 -> 88)."""
    base_time = datetime(2026, 8, 1, 10, 0, tzinfo=timezone.utc)
    scans = [
        ScanObservationData(
            scan_id="scan-1",
            observation_date=base_time,
            health_score=60.0,
            disease_probability=50.0,
        ),
        ScanObservationData(
            scan_id="scan-2",
            observation_date=base_time + timedelta(days=4),
            health_score=75.0,
            disease_probability=25.0,
        ),
        ScanObservationData(
            scan_id="scan-3",
            observation_date=base_time + timedelta(days=8),
            health_score=88.0,
            disease_probability=10.0,
        ),
    ]

    result = calculate_temporal_trends("zone-02", scans)

    assert result.classification == "IMPROVING"
    assert result.delta_total_percent == 28.0
    assert result.disease_trend == "IMPROVING"


def test_stable_trajectory():
    """Test stable trajectory within normal variance (85 -> 86 -> 85)."""
    base_time = datetime(2026, 8, 1, 10, 0, tzinfo=timezone.utc)
    scans = [
        ScanObservationData(
            scan_id="scan-1",
            observation_date=base_time,
            health_score=85.0,
        ),
        ScanObservationData(
            scan_id="scan-2",
            observation_date=base_time + timedelta(days=5),
            health_score=86.0,
        ),
        ScanObservationData(
            scan_id="scan-3",
            observation_date=base_time + timedelta(days=10),
            health_score=85.0,
        ),
    ]

    result = calculate_temporal_trends("zone-05", scans)

    assert result.classification == "STABLE"
    assert result.delta_total_percent == 0.0


def test_declining_trajectory():
    """Test moderate decline trajectory (85 -> 80 -> 77)."""
    base_time = datetime(2026, 8, 1, 10, 0, tzinfo=timezone.utc)
    scans = [
        ScanObservationData(
            scan_id="scan-1",
            observation_date=base_time,
            health_score=85.0,
        ),
        ScanObservationData(
            scan_id="scan-2",
            observation_date=base_time + timedelta(days=5),
            health_score=80.0,
        ),
        ScanObservationData(
            scan_id="scan-3",
            observation_date=base_time + timedelta(days=10),
            health_score=77.0,
        ),
    ]

    result = calculate_temporal_trends("zone-09", scans)

    assert result.classification == "DECLINING"
    assert result.delta_total_percent == -8.0
