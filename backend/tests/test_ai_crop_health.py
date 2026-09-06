import io
import pytest
from PIL import Image

from app.ai.base import CropHealthModel
from app.ai.ccmt_vision_model import CCMTCropHealthModel
from app.ai.demo import DemoCropHealthModel
from app.ai.factory import get_crop_health_model


@pytest.mark.asyncio
async def test_ccmt_crop_health_model_inference():
    """Test CCMTCropHealthModel output contract and score bounds."""
    model = get_crop_health_model()
    assert isinstance(model, CropHealthModel)
    assert model.is_prototype is False
    assert "CCMT" in model.model_name

    # Generate synthetic green healthy crop image in memory
    healthy_img = Image.new("RGB", (400, 400), color=(34, 197, 94))
    buf = io.BytesIO()
    healthy_img.save(buf, format="JPEG")
    rgb_bytes = buf.getvalue()

    prediction = await model.predict(rgb_image_bytes=rgb_bytes)

    # 1. Verify bounds
    assert 0.0 <= prediction.health_score <= 1.0
    assert 0.0 <= prediction.vegetation_stress_score <= 1.0
    assert 0.0 <= prediction.anomaly_score <= 1.0
    assert 0.0 <= prediction.disease_probability <= 1.0
    assert 0.0 <= prediction.pest_probability <= 1.0
    assert 0.0 <= prediction.confidence <= 1.0

    # 2. Verify metadata structure
    assert "detected_crop" in prediction.prediction_metadata
    assert "detected_condition" in prediction.prediction_metadata
    assert "top_candidates" in prediction.prediction_metadata
    assert "ipm_recommendations" in prediction.prediction_metadata
    assert len(prediction.prediction_metadata["top_candidates"]) > 0


@pytest.mark.asyncio
async def test_demo_prototype_model():
    """Test DemoCropHealthModel contract compatibility."""
    demo_model = DemoCropHealthModel()
    assert demo_model.is_prototype is True

    stressed_img = Image.new("RGB", (400, 400), color=(180, 150, 40))
    buf = io.BytesIO()
    stressed_img.save(buf, format="JPEG")
    rgb_bytes = buf.getvalue()

    prediction = await demo_model.predict(
        rgb_image_bytes=rgb_bytes,
        multispectral_bytes=b"FAKE_NIR_BAND_DATA",
    )

    assert 0.0 <= prediction.health_score <= 1.0
    assert prediction.vegetation_stress_score > 0.15
    assert "Multispectral_NIR" in prediction.prediction_metadata["bands_analyzed"]
