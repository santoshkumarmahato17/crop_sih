"""
Unit and Integration Tests for Crop Pest & Disease Algorithm Implementation.
Tests model architecture, data pipelines, inference engine, uncertainty quantification,
Grad-CAM explainability, and FastAPI endpoints.
"""

import io
import os
import sys
import tempfile
import pytest
from PIL import Image
import numpy as np
import torch
import torch.nn as nn
from fastapi.testclient import TestClient

# Ensure workspace and backend paths are in sys.path
WORKSPACE = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
BACKEND = os.path.join(WORKSPACE, "backend")
for p in [WORKSPACE, BACKEND]:
    if p not in sys.path:
        sys.path.insert(0, p)

from ai.models.crop_classifier import (
    CropDiseaseNet,
    create_model,
    RICE_MAIZE_CLASSES,
    CLASS_TAXONOMY,
    CONDITION_CATEGORIES,
)
from ai.pipelines.dataset import (
    CropDiseaseDataset,
    get_transforms,
    create_dataset_splits,
)
from ai.pipelines.explainability import GradCAM
from ai.inference import (
    CropDiseasePredictor,
    compute_agronomic_risk_and_advisory,
    get_crop_disease_predictor,
)
from backend.app.main import create_application


# ------------------------------------------------------------------------------
# 1. Model Architecture Tests
# ------------------------------------------------------------------------------
def test_efficientnet_architecture():
    """Verify EfficientNet-B0 backbone with custom 512->128->num_classes head."""
    model = create_model(
        num_classes=12,
        backbone_name="efficientnet_b0",
        pretrained=False,
    )
    assert isinstance(model, CropDiseaseNet)
    assert model.num_classes == 12

    # Check classifier structure
    classifier = model.classifier
    assert isinstance(classifier[0], nn.Linear)
    assert classifier[0].in_features == 1280
    assert classifier[0].out_features == 512
    assert isinstance(classifier[1], nn.ReLU)
    assert isinstance(classifier[2], nn.Dropout)
    assert classifier[2].p == 0.5

    assert isinstance(classifier[3], nn.Linear)
    assert classifier[3].in_features == 512
    assert classifier[3].out_features == 128
    assert isinstance(classifier[4], nn.ReLU)
    assert isinstance(classifier[5], nn.Dropout)
    assert classifier[5].p == 0.3

    assert isinstance(classifier[6], nn.Linear)
    assert classifier[6].in_features == 128
    assert classifier[6].out_features == 12

    # Test forward pass
    dummy_input = torch.randn(2, 3, 224, 224)
    logits = model(dummy_input)
    assert logits.shape == (2, 12)


# ------------------------------------------------------------------------------
# 2. Dataset & Augmentation Tests
# ------------------------------------------------------------------------------
def test_dataset_transforms():
    """Verify torchvision transforms for training and validation."""
    train_tf = get_transforms("train", img_size=224)
    val_tf = get_transforms("val", img_size=224)

    dummy_img = Image.new("RGB", (300, 300), color=(100, 180, 70))
    t_train = train_tf(dummy_img)
    t_val = val_tf(dummy_img)

    assert t_train.shape == (3, 224, 224)
    assert t_val.shape == (3, 224, 224)


def test_dataset_csv_and_splits():
    """Verify CSV dataset loader and split generator."""
    with tempfile.TemporaryDirectory() as tmpdir:
        # Create mock images
        samples = []
        for i, cls_name in enumerate(RICE_MAIZE_CLASSES[:4]):
            for k in range(3):
                img_path = os.path.join(tmpdir, f"sample_{i}_{k}.jpg")
                img = Image.new("RGB", (64, 64), color=(50 * i, 120, 40 + 10 * k))
                img.save(img_path)
                samples.append((img_path, cls_name))

        # Generate splits
        train_p, val_p, test_p = create_dataset_splits(
            samples,
            output_dir=tmpdir,
            train_ratio=0.5,
            val_ratio=0.25,
            test_ratio=0.25,
        )
        assert os.path.exists(train_p)
        assert os.path.exists(val_p)
        assert os.path.exists(test_p)

        # Load via CropDiseaseDataset
        ds = CropDiseaseDataset(train_p)
        assert len(ds) > 0
        tensor, label_idx, path = ds[0]
        assert tensor.shape == (3, 224, 224)
        assert isinstance(label_idx, int)


# ------------------------------------------------------------------------------
# 3. Inference Engine & Uncertainty Tests
# ------------------------------------------------------------------------------
def test_inference_engine_outputs():
    """Verify that predictor output conforms to the exact required contract."""
    predictor = CropDiseasePredictor(backbone_name="efficientnet_b0")

    # Create synthetic leaf image with brown spots (simulating disease lesion)
    img = Image.new("RGB", (256, 256), color=(40, 160, 40))
    # Add a brownish lesion patch
    for x in range(100, 140):
        for y in range(100, 140):
            img.putpixel((x, y), (140, 80, 30))

    result = predictor.predict(img, top_k=3, include_gradcam=True)

    # Validate mandatory schema keys
    assert "crop" in result
    assert result["crop"] in ["rice", "maize"]
    assert "condition" in result
    assert result["condition"] in [
        "Disease", "Pest", "Healthy", "Nutrient deficiency",
        "Water stress / abiotic", "Unknown / needs expert review"
    ]
    assert "class" in result
    assert result["class"] in RICE_MAIZE_CLASSES
    assert "confidence" in result
    assert 0.0 <= result["confidence"] <= 1.0
    assert "severity" in result
    assert result["severity"] in ["low", "medium", "high"]
    assert "severity_score" in result
    assert 0.0 <= result["severity_score"] <= 1.0
    assert "needs_expert_review" in result
    assert isinstance(result["needs_expert_review"], bool)

    # Validate Grad-CAM heatmap was generated
    assert "explanation_heatmap_base64" in result
    assert result["explanation_heatmap_base64"].startswith("data:image/png;base64,")


def test_uncertainty_flag_trigger():
    """Verify uncertainty flag triggers when confidence is low or margin is narrow."""
    predictor = CropDiseasePredictor(confidence_threshold=0.99)
    img = Image.new("RGB", (224, 224), color=(100, 100, 100))
    result = predictor.predict(img)
    # High confidence threshold ensures uncertainty is triggered
    assert result["needs_expert_review"] is True


# ------------------------------------------------------------------------------
# 4. Grad-CAM Explainability Tests
# ------------------------------------------------------------------------------
def test_gradcam_generation():
    """Verify Grad-CAM hooks and heatmap overlay generation."""
    model = create_model(num_classes=12, backbone_name="efficientnet_b0", pretrained=False)
    gradcam = GradCAM(model)

    dummy_tensor = torch.randn(1, 3, 224, 224)
    heatmap = gradcam.generate(dummy_tensor, target_class_idx=0)

    assert isinstance(heatmap, (torch.Tensor, object))
    assert heatmap.shape == (7, 7) or len(heatmap.shape) == 2
    assert np.min(heatmap) >= 0.0
    assert np.max(heatmap) <= 1.0

    # Test overlay
    dummy_img = Image.new("RGB", (224, 224), color=(60, 150, 60))
    overlay = gradcam.overlay_heatmap(dummy_img, heatmap)
    assert overlay.size == (224, 224)
    uri = gradcam.to_base64_data_uri(overlay)
    assert uri.startswith("data:image/png;base64,")


# ------------------------------------------------------------------------------
# 5. Multi-Factor Agronomic Risk Advisory Tests
# ------------------------------------------------------------------------------
def test_agronomic_risk_advisory():
    """Verify weather and crop stage integration with vision diagnosis."""
    mock_prediction = {
        "crop": "rice",
        "condition": "Disease",
        "class": "rice_blast",
        "confidence": 0.88,
        "severity": "high",
        "severity_score": 0.75,
        "scientific_name": "Magnaporthe oryzae",
        "ipm_recommendations": [
            {"action": "Fungicide", "detail": "Apply Tricyclazole 75 WP."}
        ],
    }
    weather = {
        "temperature_c": 28.0,
        "humidity_percent": 88.0,
        "rainfall_mm": 12.0,
    }
    advisory = compute_agronomic_risk_and_advisory(
        prediction=mock_prediction,
        weather=weather,
        crop_stage="booting",
    )

    assert "composite_risk_score" in advisory
    assert advisory["composite_risk_score"] > 60.0
    assert advisory["risk_level"] in ["High", "Critical"]
    assert "advisory_summary" in advisory
    assert len(advisory["recommended_actions"]) > 0


# ------------------------------------------------------------------------------
# 6. FastAPI Endpoint Tests
# ------------------------------------------------------------------------------
def test_fastapi_predict_endpoint():
    """Verify FastAPI /predict endpoint accepts image file and returns valid JSON."""
    app = create_application()
    client = TestClient(app)

    # Create mock JPEG in memory
    buf = io.BytesIO()
    img = Image.new("RGB", (224, 224), color=(45, 140, 50))
    img.save(buf, format="JPEG")
    buf.seek(0)

    # Test POST /predict
    response = client.post(
        "/predict",
        files={"file": ("test_leaf.jpg", buf, "image/jpeg")},
        data={"crop_stage": "vegetative", "temperature_c": 26.5, "humidity_percent": 75.0},
    )

    assert response.status_code == 200
    data = response.json()
    assert "crop" in data
    assert "condition" in data
    assert "class" in data
    assert "confidence" in data
    assert "severity" in data
    assert "needs_expert_review" in data
    assert "agronomic_advisory" in data

    # Test GET /predict/classes
    res_classes = client.get("/predict/classes")
    assert res_classes.status_code == 200
    classes_data = res_classes.json()
    assert classes_data["total_classes"] == 12
    assert "rice" in classes_data["crops"]
    assert "maize" in classes_data["crops"]
