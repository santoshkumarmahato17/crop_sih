import pytest
from app.ai.diagnosis_engine import PrototypeDiseaseIdentificationService
from app.schemas.diagnosis import (
    SymptomAnalysisRequest,
    SymptomAnalysisResponse,
    ConditionCandidate,
)


@pytest.mark.asyncio
async def test_ai_disease_identification_engine():
    """Test AI heuristic disease diagnosis reasoning engine across symptoms & growth stage."""
    service = PrototypeDiseaseIdentificationService()
    
    result = await service.analyze_crop_health(
        crop_type="Tomato",
        growth_stage="Flowering",
        plant_parts=["Leaf", "Stem"],
        symptoms=["Spots", "Yellowing", "Browning"],
        severity="HIGH",
        distribution="One section of the zone",
        symptom_start_date="4–7 days ago",
        farmer_notes="Lower leaves show concentric circular dark rings.",
        zone_telemetry={"zone_code": "Z17", "trend": "DECLINING"},
        has_images=True,
    )

    assert result.status == "AI_SUSPECTED"
    assert "Early Blight" in result.primary_condition or "Alternaria" in result.primary_condition
    assert result.confidence >= 0.70
    assert len(result.possible_conditions) >= 2
    assert len(result.reasoning_points) >= 3
    assert len(result.recommendations) >= 2
    assert result.follow_up_monitoring["is_recommended"] is True
    assert result.is_prototype is True


@pytest.mark.asyncio
async def test_ai_disease_identification_wheat_stripe_rust():
    """Test AI diagnosis reasoning for Wheat Yellow / Stripe Rust."""
    service = PrototypeDiseaseIdentificationService()

    result = await service.analyze_crop_health(
        crop_type="Wheat",
        growth_stage="Grain Filling",
        plant_parts=["Leaf"],
        symptoms=["Rust-like appearance", "Yellowing", "Powdery coating"],
        severity="SEVERE",
        distribution="Most of the zone",
        symptom_start_date="1–3 days ago",
        has_images=True,
    )

    assert result.status == "AI_SUSPECTED"
    assert "Yellow / Stripe Rust" in result.primary_condition or "Rust" in result.primary_condition
    assert result.confidence >= 0.75
    assert any("Triazole" in rec["title"] or "IPM" in rec["action_type"] for rec in result.recommendations)


@pytest.mark.asyncio
async def test_low_confidence_fallback():
    """Test that ambiguous or sparse symptoms do not trigger overconfident diagnosis."""
    service = PrototypeDiseaseIdentificationService()

    result = await service.analyze_crop_health(
        crop_type="Tomato",
        growth_stage="Seedling",
        plant_parts=["Root"],
        symptoms=["Slow growth"],
        severity="LOW",
        distribution="Single plant",
        symptom_start_date="Today",
        has_images=False,
    )

    assert result.confidence < 0.85
    assert any("Physiological" in cond["pathogen_type"] or "Nutrient" in cond["condition_name"] for cond in result.possible_conditions)
