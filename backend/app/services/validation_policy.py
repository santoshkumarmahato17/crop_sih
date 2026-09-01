"""
AGRI SHIELD — Expert Validation Policy Engine.
Provides configurable rules to determine when an AI prediction or field telemetry
observation mandates human agricultural expert validation.
"""

from typing import Dict, Any, List, Optional
from app.models.validation import ValidationPriority


class ValidationPolicyEngine:
    """Configurable ground-truth validation rules and priority scoring."""

    # Default Rule Thresholds
    MIN_AI_CONFIDENCE_THRESHOLD = 0.75
    CRITICAL_AI_CONFIDENCE_THRESHOLD = 0.50
    HIGH_RISK_PATHOGENS = {
        "late blight",
        "early blight",
        "yellow rust",
        "pink bollworm",
        "bacterial blight",
        "telya",
        "downy mildew",
        "fall armyworm",
        "spodoptera",
        "fusarium wilt",
    }
    CRITICAL_CROPS = {"cotton", "sugarcane", "soybean", "grapes", "pomegranate", "tomato", "wheat", "paddy"}

    @classmethod
    def evaluate_validation_requirement(
        cls,
        ai_confidence: float,
        condition_name: str,
        crop_name: Optional[str] = None,
        weather_risk_level: Optional[str] = None,
        is_farmer_request: bool = False,
        is_officer_request: bool = False,
        has_conflicting_signals: bool = False,
    ) -> Dict[str, Any]:
        """
        Evaluates whether an observation requires expert validation and determines priority.
        Returns: { 'required': bool, 'priority': ValidationPriority, 'reason': str }
        """
        reasons: List[str] = []
        priority = ValidationPriority.LOW
        condition_lower = condition_name.lower()
        crop_lower = crop_name.lower() if crop_name else ""

        # 1. Explicit Farmer Request
        if is_farmer_request:
            reasons.append("Farmer explicitly requested extension specialist verification")
            priority = ValidationPriority.MEDIUM

        # 2. Government Officer Override
        if is_officer_request:
            reasons.append("Regional Agriculture Officer ordered priority ground-truth inspection")
            priority = ValidationPriority.HIGH

        # 3. High Risk Pathogen or Pest
        is_high_risk_pathogen = any(p in condition_lower for p in cls.HIGH_RISK_PATHOGENS)
        if is_high_risk_pathogen:
            reasons.append(f"High-impact pathogen detected ({condition_name}) with rapid contagion profile")
            priority = ValidationPriority.HIGH

        # 4. Low AI Confidence Anomaly
        if ai_confidence < cls.CRITICAL_AI_CONFIDENCE_THRESHOLD:
            reasons.append(f"Low AI optical confidence ({ai_confidence:.0%}) indicates atypical or multiple symptoms")
            priority = ValidationPriority.HIGH
        elif ai_confidence < cls.MIN_AI_CONFIDENCE_THRESHOLD:
            reasons.append(f"Borderline AI model confidence ({ai_confidence:.0%}) below confidence baseline")
            if priority != ValidationPriority.HIGH:
                priority = ValidationPriority.MEDIUM

        # 5. Compound Weather Escalation
        if weather_risk_level in ["HIGH", "SEVERE", "CRITICAL"]:
            reasons.append(f"Favorable microclimate ({weather_risk_level} weather risk) accelerates foliar spread")
            if is_high_risk_pathogen:
                priority = ValidationPriority.CRITICAL
            else:
                priority = max_priority(priority, ValidationPriority.HIGH)

        # 6. Conflicting Signals
        if has_conflicting_signals:
            reasons.append("Conflicting AI predictions detected across multi-angle scan frames")
            priority = max_priority(priority, ValidationPriority.MEDIUM)

        is_required = len(reasons) > 0

        return {
            "required": is_required,
            "priority": priority if is_required else ValidationPriority.LOW,
            "reason": " • ".join(reasons) if reasons else "Routine healthy monitoring (no validation required)",
        }


def max_priority(p1: ValidationPriority, p2: ValidationPriority) -> ValidationPriority:
    order = [ValidationPriority.LOW, ValidationPriority.MEDIUM, ValidationPriority.HIGH, ValidationPriority.CRITICAL]
    return p1 if order.index(p1) >= order.index(p2) else p2
