import io
import pytest
from PIL import Image

from app.ai.demo import DemoCropHealthModel
from app.ai.factory import get_crop_health_model


@pytest.mark.asyncio
async def test_demo_crop_health_model_inference():
    """Test DemoCropHealthModel output contract and score bounds."""
    model = get_crop_health_model()
    assert isinstance(model, DemoCropHealthModel)
    assert model.is_prototype is True

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

    # 2. Healthy green crop should have high health score (> 0.6)
    assert prediction.health_score > 0.6

    # 3. Verify Prototype labels and scientific disclaimer
    assert "DEMO / PROTOTYPE" in prediction.prediction_metadata["prototype_label"]
    assert "scientific_disclaimer" in prediction.prediction_metadata


@pytest.mark.asyncio
async def test_stressed_crop_inference():
    """Test chlorotic / yellow-brown stressed crop prediction."""
    model = get_crop_health_model()

    # Generate synthetic yellow/brown stressed crop image
    stressed_img = Image.new("RGB", (400, 400), color=(180, 150, 40))
    buf = io.BytesIO()
    stressed_img.save(buf, format="JPEG")
    rgb_bytes = buf.getvalue()

    prediction = await model.predict(
        rgb_image_bytes=rgb_bytes,
        multispectral_bytes=b"FAKE_NIR_BAND_DATA",
    )

    # Stressed crop should exhibit lower vitality and elevated stress score
    assert prediction.health_score < 0.8
    assert prediction.vegetation_stress_score > 0.15
    assert "Multispectral_NIR" in prediction.prediction_metadata["bands_analyzed"]
