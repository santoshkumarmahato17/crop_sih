"""
KISAN SATHI — Monitoring Policy & Scheduling Turnaround Engine.
Calculates dynamic turnaround deadlines, spatial buffer zones, and duplicate prevention.
"""

from datetime import datetime, timedelta, timezone
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from sqlalchemy import select, and_

from app.models.monitoring import (
    MonitoringPriority,
    MonitoringTask,
    MonitoringTaskStatus,
    MonitoringPolicyConfig,
)


class MonitoringPolicyEngine:
    """Calculates dynamic follow-up turnaround deadlines and targeted spatial buffer zones."""

    @staticmethod
    def calculate_due_date(
        priority: MonitoringPriority,
        base_time: Optional[datetime] = None,
        policy: Optional[MonitoringPolicyConfig] = None,
    ) -> datetime:
        """
        Calculates authoritative deadline based on dynamic priority turnaround policies.
        """
        start = base_time or datetime.now(timezone.utc)
        
        crit_hours = policy.critical_hours if policy else 24
        high_hours = policy.high_hours if policy else 48
        med_days = policy.medium_days if policy else 4
        low_days = policy.low_days if policy else 7

        if priority == MonitoringPriority.CRITICAL:
            return start + timedelta(hours=crit_hours)
        elif priority == MonitoringPriority.HIGH:
            return start + timedelta(hours=high_hours)
        elif priority == MonitoringPriority.MEDIUM:
            return start + timedelta(days=med_days)
        else:
            return start + timedelta(days=low_days)

    @staticmethod
    def calculate_priority_from_risk(
        disease_risk: float,
        pest_risk: float = 0.0,
        water_stress: float = 0.0,
        is_hotspot_active: bool = False,
    ) -> MonitoringPriority:
        """
        Derives monitoring urgency level based on composite risk vectors.
        """
        max_risk = max(disease_risk, pest_risk, water_stress * 100.0)

        if max_risk >= 80.0 or (is_hotspot_active and max_risk >= 70.0):
            return MonitoringPriority.CRITICAL
        elif max_risk >= 65.0:
            return MonitoringPriority.HIGH
        elif max_risk >= 40.0:
            return MonitoringPriority.MEDIUM
        else:
            return MonitoringPriority.LOW

    @staticmethod
    def compute_targeted_envelope(
        primary_zone_name: str,
        adjacent_zones: Optional[List[str]] = None,
    ) -> List[str]:
        """
        Generates targeted monitoring envelope for high-priority / hotspot areas.
        e.g. Z17 primary + adjacent Z16 & Z18.
        """
        envelope = [primary_zone_name] if primary_zone_name else []
        if adjacent_zones:
            for z in adjacent_zones:
                if z and z not in envelope:
                    envelope.append(z)
        return envelope

    @staticmethod
    def is_duplicate_active_task(
        db: Session,
        farm_id: str,
        zone_id: Optional[str],
        trigger_type: str,
    ) -> bool:
        """
        Prevents spawning duplicate monitoring tasks for the same zone within active turnaround.
        """
        if not zone_id:
            return False

        active_statuses = [
            MonitoringTaskStatus.SCHEDULED,
            MonitoringTaskStatus.ASSIGNED,
            MonitoringTaskStatus.IN_PROGRESS,
        ]

        stmt = select(MonitoringTask).where(
            and_(
                MonitoringTask.farm_id == farm_id,
                MonitoringTask.zone_id == zone_id,
                MonitoringTask.status.in_(active_statuses),
            )
        )
        existing = db.scalars(stmt).first()
        return existing is not None
