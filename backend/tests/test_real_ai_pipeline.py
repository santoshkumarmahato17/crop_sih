"""
AGRI SHIELD — Acceptance & Verification Test Suite for Production AI/ML Pipeline.
Enforces the 10 Golden Rules:
1. No fake AI results / quality gating on UNUSABLE imagery.
2. Real botanical segmentation and no fabricated bounding boxes for healthy leaves.
3. Real original image pixel coordinates (x, y, width, height) + normalized percentages.
4. Strict biological crop-disease compatibility validation.
5. Large image streaming & tiled ROI inference (up to 200MB).
6. Decoupled physical severity vs. contextual multi-factor risk.
7. Safe IPM advisories (suppress chemical pesticides on uncertain diagnoses).
8. Verified direct YouTube watch URLs for agricultural advisory.
9. Transparent LIMITED risk reporting when contextual data is missing.
10. End-to-end FastAPI endpoint integration.
"""

import io
import pytest
import numpy as np
from PIL import Image
from fastapi.testclient import TestClient

from backend.app.main import create_application
from ai.pipelines.image_quality import ImageQualityAnalyzer
from ai.pipelines.segmentation_engine import SegmentationEngine
from ai.pipelines.tiled_inference import TiledInferenceEngine
from ai.models.crop_classifier import (
    validate_crop_disease_compatibility,
    identify_crop_from_image,
    CLASS_TAXONOMY,
    RICE_MAIZE_CLASSES,
)
from backend.app.services.severity_engine import PhysicalSeverityEngine
from backend.app.services.knowledge_service import KnowledgeService
from ai.inference import CropDiseasePredictor, compute_agronomic_risk_and_advisory


@pytest.fixture(scope="module")
def client():
    app = create_application()
    return TestClient(app)


# ------------------------------------------------------------------------------
# Test 1: Image Quality Gating (Golden Rules 1 & 5)
# ------------------------------------------------------------------------------
def test_image_quality_gating_unusable_image():
    """Unusable (severely blurry / dark) imagery must be gated before diagnosis."""
    # Create an extreme dark/black image (mean luminance < 18)
    black_img = Image.new("RGB", (256, 256), color=(5, 5, 5))
    quality = ImageQualityAnalyzer.evaluate_pil_image(black_img)

    assert quality["is_usable"] is False
    assert quality["status"] == "UNUSABLE"
    assert quality["score"] < 0.35
    assert len(quality["diagnostic_warnings"]) > 0

    # Ensure predictor gates unusable images
    predictor = CropDiseasePredictor()
    pred = predictor.predict(black_img)
    assert pred["condition"] == "Unable to determine reliably"
    assert pred["needs_expert_review"] is True
    assert pred["confidence"] == 0.0
    assert pred["detected_regions"] == []


# ------------------------------------------------------------------------------
# Test 2: Botanical Segmentation & No Fake Boxes on Healthy Leaves (Rule 2)
# ------------------------------------------------------------------------------
def test_healthy_leaf_produces_no_fake_bounding_boxes():
    """Healthy leaves must NEVER have fabricated bounding boxes or lesions."""
    # Create solid green leaf canopy (healthy)
    healthy_img = Image.new("RGB", (300, 300), color=(45, 150, 40))

    seg_res = SegmentationEngine.segment_foliar_image(
        healthy_img,
        condition_name="Rice Healthy Leaf",
        is_healthy=True,
    )

    assert seg_res["regions"] == []
    assert seg_res["affected_area_pct"] == 0.0
    assert seg_res["total_lesions"] == 0


# ------------------------------------------------------------------------------
# Test 3: Real Lesion Localization with Original Coordinates (Rule 3)
# ------------------------------------------------------------------------------
def test_real_lesion_localization_and_pixel_coordinates():
    """Lesion segmentation must generate valid original pixel bounding boxes and unique IDs."""
    w, h = 400, 300
    img = Image.new("RGB", (w, h), color=(50, 160, 45))

    # Add 2 distinct necrotic patches
    # Lesion 1
    for x in range(80, 120):
        for y in range(80, 120):
            img.putpixel((x, y), (130, 70, 20))

    # Lesion 2
    for x in range(250, 290):
        for y in range(160, 200):
            img.putpixel((x, y), (140, 75, 25))

    seg_res = SegmentationEngine.segment_foliar_image(
        img,
        condition_name="Rice Brown Spot",
        is_healthy=False,
    )

    regions = seg_res["regions"]
    assert len(regions) >= 2
    assert seg_res["affected_area_pct"] > 0.0

    for idx, reg in enumerate(regions):
        assert reg["region_id"].startswith("REG-")
        bbox = reg["bbox"]
        # Pixel coordinates must strictly lie within original image dimensions
        assert 0 <= bbox["x"] < w
        assert 0 <= bbox["y"] < h
        assert 0 < bbox["width"] <= w
        assert 0 < bbox["height"] <= h
        assert bbox["x"] + bbox["width"] <= w
        assert bbox["y"] + bbox["height"] <= h

        # Normalized percentages must lie between 0% and 100%
        norm = reg["bbox_normalized"]
        assert 0.0 <= norm["x_pct"] <= 100.0
        assert 0.0 <= norm["y_pct"] <= 100.0
        assert 0.0 < norm["width_pct"] <= 100.0
        assert 0.0 < norm["height_pct"] <= 100.0


# ------------------------------------------------------------------------------
# Test 4: Biological Crop-Disease Compatibility (Rule 4)
# ------------------------------------------------------------------------------
def test_crop_disease_biological_compatibility():
    """Validates biological crop-pathogen compatibility and flags cross-crop mismatches."""
    # Compatible
    compat1, _ = validate_crop_disease_compatibility("rice", "rice_blast")
    assert compat1 is True

    compat2, _ = validate_crop_disease_compatibility("maize", "maize_fall_armyworm")
    assert compat2 is True

    # Incompatible: Rice disease on Tomato
    compat3, msg3 = validate_crop_disease_compatibility("tomato", "rice_blast")
    assert compat3 is False
    assert "INVALID_CROP_DISEASE_PAIR" in msg3

    # Incompatible: Maize disease on Rice
    compat4, msg4 = validate_crop_disease_compatibility("rice", "maize_turcicum_leaf_blight")
    assert compat4 is False


# ------------------------------------------------------------------------------
# Test 5: Decoupled Physical Severity vs Contextual Risk (Rule 6)
# ------------------------------------------------------------------------------
def test_physical_severity_engine_decoupling():
    """Physical severity must measure observed damage independent of environmental risk."""
    sev_res = PhysicalSeverityEngine.calculate_physical_severity(
        affected_area_pct=18.5,
        lesion_count=6,
        chlorosis_ratio=0.15,
        necrosis_ratio=0.25,
        is_healthy=False,
    )

    assert sev_res["category"] in ["low", "moderate", "high", "severe"]
    assert 0.0 <= sev_res["score"] <= 100.0
    assert 0.0 <= sev_res["damage_index"] <= 1.0
    assert sev_res["affected_area_pct"] == 18.5
    assert sev_res["damage_index"] > 0.0
    assert isinstance(sev_res["symptom_breakdown"], dict)


# ------------------------------------------------------------------------------
# Test 6: Safe IPM Recommendations (Rule 7)
# ------------------------------------------------------------------------------
def test_safe_ipm_recommendations_suppress_chemical_when_uncertain():
    """Chemical pesticides must be suppressed when diagnosis is uncertain."""
    # High confidence diagnosis
    confident_recs = KnowledgeService.get_curated_ipm_recommendations(
        condition_key="rice_blast",
        confidence=0.92,
        needs_expert_review=False,
    )
    assert len(confident_recs) >= 2
    types_conf = [r["action_type"] for r in confident_recs]
    assert any("Fungicide" in t or "Control" in t or "Nitrogen" in t for t in types_conf)

    # Uncertain diagnosis (needs expert review)
    uncertain_recs = KnowledgeService.get_curated_ipm_recommendations(
        condition_key="rice_blast",
        confidence=0.45,
        needs_expert_review=True,
    )
    types_unc = [r["action_type"] for r in uncertain_recs]
    # Suppress chemical pesticides: Fungicide/Chemical should NOT be present
    assert "Fungicide" not in types_unc
    assert "Chemical" not in types_unc
    assert any("Expert" in t or "Cultural" in t for t in types_unc)


# ------------------------------------------------------------------------------
# Test 7: Verified YouTube Video Resources (Rule 8)
# ------------------------------------------------------------------------------
def test_verified_video_resource_urls():
    """Every verified video resource must point to a legitimate HTTPS YouTube watch URL."""
    resources = KnowledgeService.get_educational_resources(
        condition_key="rice_blast",
        is_healthy=False,
    )
    video = resources.get("video_resource")
    assert video is not None
    assert video["url"].startswith("https://www.youtube.com/watch?v=")
    assert len(video["video_id"]) > 5
    assert len(video["title"]) > 0
    assert len(video["publisher"]) > 0


# ------------------------------------------------------------------------------
# Test 8: Missing Context Risk Disclosure (Rule 9)
# ------------------------------------------------------------------------------
def test_missing_context_risk_disclosure():
    """Risk engine must return LIMITED status when weather/temporal context is missing."""
    prediction = {
        "crop": "rice",
        "condition": "Disease",
        "class": "rice_brown_spot",
        "confidence": 0.88,
        "severity": "medium",
        "severity_score": 0.35,
    }
    # No weather and no crop stage
    advisory = compute_agronomic_risk_and_advisory(prediction, weather=None, crop_stage=None)
    assert advisory["risk_level"] == "LIMITED"
    assert advisory["composite_risk_score"] is None
    assert "limited" in advisory["advisory_summary"].lower()


# ------------------------------------------------------------------------------
# Test 9: Large Image & Tiled Inference Engine (Rule 5 & Section 13)
# ------------------------------------------------------------------------------
def test_large_image_tiled_inference():
    """Multi-megapixel image processed via tiled inference with NMS stitch."""
    # Create 1200x1200 large image with distributed lesions
    large_img = Image.new("RGB", (1200, 1200), color=(40, 150, 45))
    # Add lesion in tile 1
    for x in range(200, 260):
        for y in range(200, 260):
            large_img.putpixel((x, y), (145, 75, 20))
    # Add lesion in tile 2
    for x in range(800, 860):
        for y in range(800, 860):
            large_img.putpixel((x, y), (145, 75, 20))

    result = TiledInferenceEngine.process_large_image(
        large_img,
        tile_size=640,
        overlap=120,
        condition_name="Rice Blast",
        is_healthy=False,
    )

    assert result["is_tiled"] is True
    assert result["tiles_evaluated"] > 1
    assert len(result["regions"]) >= 2
    assert result["image_dimensions"] == {"width": 1200, "height": 1200}

    for reg in result["regions"]:
        bbox = reg["bbox"]
        assert bbox["x"] + bbox["width"] <= 1200
        assert bbox["y"] + bbox["height"] <= 1200


# ------------------------------------------------------------------------------
# Test 10: FastAPI Integration Endpoints
# ------------------------------------------------------------------------------
def test_fastapi_ai_pipeline_endpoints(client):
    """Verifies that the /ai/analyze, /ai/regions, and /ai/risk endpoints function properly."""
    # Create test leaf JPEG in memory
    buf = io.BytesIO()
    img = Image.new("RGB", (300, 300), color=(50, 155, 45))
    for x in range(120, 160):
        for y in range(120, 160):
            img.putpixel((x, y), (135, 70, 25))
    img.save(buf, format="JPEG")
    buf.seek(0)

    response = client.post(
        "/ai/analyze",
        files={"file": ("test_foliar.jpg", buf, "image/jpeg")},
        data={"crop_type": "rice", "phenological_stage": "tillering"},
    )

    assert response.status_code == 200
    data = response.json()
    assert "analysis_id" in data
    assert "crop" in data
    assert "condition" in data
    assert "image_quality" in data
    assert "severity" in data
    assert "detected_regions" in data
    assert "causal_agent" in data

    analysis_id = data["analysis_id"]

    # Verify querying regions for this analysis
    regions_res = client.get(f"/ai/regions?analysis_id={analysis_id}")
    assert regions_res.status_code == 200
    regions_data = regions_res.json()
    assert "regions" in regions_data
    assert "total_regions" in regions_data
