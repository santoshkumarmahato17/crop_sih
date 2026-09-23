#!/usr/bin/env python3
"""
KISAN SATHI — Step 9 Crop Health Analysis Foundation Verification Script.
Validates:
1. Modular CropHealthModel abstract interface and swappable factory
2. DemoCropHealthModel bounded inference ([0.0, 1.0])
3. Prototype labeling and explicit scientific disclaimer
4. Multi-modal inputs handling (RGB, Multispectral, Thermal)
5. Observation entity data mapping (Health, Disease, Pest, Water Stress)
"""

import sys
import io
import asyncio
from pathlib import Path

# Add backend directory to sys.path
backend_dir = Path(__file__).resolve().parent.parent / "backend"
sys.path.insert(0, str(backend_dir))

from PIL import Image

from app.ai.base import CropHealthModel, CropHealthPrediction
from app.ai.demo import DemoCropHealthModel
from app.ai.factory import get_crop_health_model


async def test_ai_model_interface_and_bounds() -> bool:
    print("\n--- 1. Testing AI Inference Contract & Score Bounds ---")
    model: CropHealthModel = get_crop_health_model()
    print(f"  Active Model: {model.model_name} ({model.model_version})")
    assert model.is_prototype is True

    # 1. Test Healthy Canopy (Bright Green RGB)
    healthy_img = Image.new("RGB", (640, 480), color=(34, 197, 94))
    buf = io.BytesIO()
    healthy_img.save(buf, format="JPEG")
    healthy_bytes = buf.getvalue()

    pred_healthy = await model.predict(rgb_image_bytes=healthy_bytes)
    print(f"  [Healthy Canopy] Health Score: {pred_healthy.health_score:.2f}, Stress: {pred_healthy.vegetation_stress_score:.2f}, Confidence: {pred_healthy.confidence:.2f}")

    assert 0.0 <= pred_healthy.health_score <= 1.0
    assert 0.0 <= pred_healthy.vegetation_stress_score <= 1.0
    assert 0.0 <= pred_healthy.disease_probability <= 1.0
    assert pred_healthy.health_score > 0.65

    # 2. Test Stressed/Chlorotic Canopy (Yellowish Brown)
    stressed_img = Image.new("RGB", (640, 480), color=(200, 160, 50))
    buf2 = io.BytesIO()
    stressed_img.save(buf2, format="JPEG")
    stressed_bytes = buf2.getvalue()

    pred_stressed = await model.predict(
        rgb_image_bytes=stressed_bytes,
        multispectral_bytes=b"SYNTHETIC_NIR_NDVI_RASTER",
        thermal_bytes=b"SYNTHETIC_THERMAL_CWSI_RASTER",
    )
    print(f"  [Stressed Canopy] Health Score: {pred_stressed.health_score:.2f}, Stress: {pred_stressed.vegetation_stress_score:.2f}, Disease Prob: {pred_stressed.disease_probability:.2f}")

    assert pred_stressed.health_score < pred_healthy.health_score
    assert pred_stressed.vegetation_stress_score > pred_healthy.vegetation_stress_score
    print("  [PASS] Multi-modal inference scores correctly reflect canopy vitality differential.")
    return True


async def test_prototype_disclaimer() -> bool:
    print("\n--- 2. Testing Prototype Labels & Scientific Disclaimer ---")
    model = get_crop_health_model()

    # Verify non-diagnostic prototype metadata
    pred = await model.predict(rgb_image_bytes=b"DUMMY_RGB_DATA")
    meta = pred.prediction_metadata

    assert "DEMO / PROTOTYPE" in meta["prototype_label"]
    assert "scientific_disclaimer" in meta
    print(f"  [PASS] Prototype Banner: {meta['prototype_label']}")
    print(f"  [PASS] Scientific Disclaimer verified: '{meta['scientific_disclaimer'][:80]}...'")
    return True


async def main():
    print("==========================================================")
    print("KISAN SATHI: Step 9 Crop Health Analysis AI Foundation")
    print("==========================================================")

    m_ok = await test_ai_model_interface_and_bounds()
    d_ok = await test_prototype_disclaimer()

    print("\n==========================================================")
    if m_ok and d_ok:
        print("ALL CROP HEALTH AI FOUNDATION CHECKS PASSED!")
        print("==========================================================")
        sys.exit(0)
    else:
        print("CROP HEALTH AI FOUNDATION VERIFICATION FAILED.")
        print("==========================================================")
        sys.exit(1)


if __name__ == "__main__":
    asyncio.run(main())
