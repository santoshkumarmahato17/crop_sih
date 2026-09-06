"""
AGRI SHIELD — Standalone Crop Pathology Severity Engine.
Evaluates current observed physical damage on foliar tissue (affected area %,
lesion density, and visual degradation index) strictly decoupled from contextual risk.
"""

from typing import Any, Dict, Optional


class SeverityEngine:
    """
    Computes visual pathology damage severity.
    Rule 20: Severity reflects current physical observed damage, distinct from future risk.
    """

    @classmethod
    def evaluate_severity(
        cls,
        affected_area_pct: float,
        lesion_count: int,
        is_healthy: bool = False,
        quality_score: float = 1.0,
    ) -> Dict[str, Any]:
        """
        Evaluates physical damage severity level and score.
        """
        if is_healthy or affected_area_pct <= 0.5:
            return {
                "level": "LOW",
                "score": 5.0,
                "confidence": round(min(0.98, 0.85 * quality_score), 2),
                "affected_area_pct": 0.0,
                "lesion_count": 0,
                "summary": "Foliar canopy exhibits negligible physical lesion damage.",
            }

        # Calculate severity score (0 to 100) based on affected area % and lesion count
        # 1. Base score from affected leaf area (0 - 50% maps to 0 - 80 points)
        area_score = min(80.0, affected_area_pct * 1.8)

        # 2. Lesion density bonus (multiple lesions increase severity score)
        lesion_bonus = min(20.0, lesion_count * 2.5)

        raw_score = area_score + lesion_bonus
        severity_score = round(min(100.0, max(5.0, raw_score)), 1)

        # Categorical level mapping
        if affected_area_pct < 5.0 and lesion_count <= 2:
            level = "LOW"
        elif affected_area_pct < 15.0 or severity_score < 55.0:
            level = "MODERATE"
        elif affected_area_pct < 35.0 or severity_score < 80.0:
            level = "HIGH"
        else:
            level = "CRITICAL"

        # Severity confidence depends on image quality and lesion contrast
        confidence = round(min(0.95, 0.70 + (0.25 * quality_score)), 2)

        return {
            "level": level,
            "category": level.lower(),
            "score": severity_score,
            "confidence": confidence,
            "affected_area_pct": round(affected_area_pct, 2),
            "lesion_count": lesion_count,
            "summary": f"{level} physical foliar damage detected ({affected_area_pct}% leaf blade affected across {lesion_count} localized lesions).",
            "damage_index": round(severity_score / 100.0, 3),
            "symptom_breakdown": {
                "necrosis_pct": round(affected_area_pct * 0.65, 1),
                "chlorosis_pct": round(affected_area_pct * 0.35, 1),
            },
        }

    @classmethod
    def calculate_physical_severity(cls, **kwargs) -> Dict[str, Any]:
        """Convenience alias for evaluate_severity."""
        return cls.evaluate_severity(
            affected_area_pct=kwargs.get("affected_area_pct", 0.0),
            lesion_count=kwargs.get("lesion_count", 0),
            is_healthy=kwargs.get("is_healthy", False),
            quality_score=kwargs.get("quality_score", 1.0),
        )


PhysicalSeverityEngine = SeverityEngine

