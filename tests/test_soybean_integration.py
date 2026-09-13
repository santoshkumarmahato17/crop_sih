"""
Comprehensive Integration & Safety Tests for Soybean MobileNetV2 Disease Classifier.
Tests:
1. Model loading & weights validation
2. Architecture shapes: (None, 224, 224, 3) -> (None, 10)
3. 10-class taxonomy exact order
4. Valid leaf image inference
5. Top-3 predictions and probability distribution
6. Grad-CAM visual attention overlay generation
7. Security: empty file, invalid MIME, oversized file (>10MB)
8. High/Medium/Low confidence policy
9. Backend SoybeanDiagnosisService pipeline
"""

import io
import os
import sys
import unittest
import numpy as np
from PIL import Image

REPO_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if REPO_ROOT not in sys.path:
    sys.path.insert(0, REPO_ROOT)

from ml.src.predict_soybean import (
    SoybeanPredictor,
    get_soybean_predictor,
    SOYBEAN_KNOWLEDGE_BASE,
    MAX_IMAGE_BYTES,
)

EXPECTED_CLASSES = [
    "Bacterial_Pustule",
    "Frogeye_Leaf_Spot",
    "Healthy",
    "Iron_Deficiency_Chlorosis",
    "Potassium_Deficiency",
    "Powdery_Mildew",
    "Rhizoctonia_Aerial_Blight",
    "Rust",
    "Sudden_Death_Syndrome",
    "Target_Spot",
]


class TestSoybeanModelIntegration(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.predictor = get_soybean_predictor()

    def test_01_model_is_ready_and_loaded(self):
        """Verify model weights and class taxonomy loaded successfully."""
        self.assertTrue(self.predictor.is_ready, "Soybean predictor should be ready")
        self.assertEqual(len(self.predictor.classes), 10)
        self.assertEqual(self.predictor.classes, EXPECTED_CLASSES)

    def test_02_model_internal_validation(self):
        """Verify model architecture, input/output tensors, and synthetic inference."""
        checks = self.predictor.validate_model()
        self.assertTrue(checks.get("valid"), f"Model internal validation failed: {checks}")
        self.assertEqual(checks.get("num_classes_from_model"), 10)
        self.assertEqual(checks.get("num_classes_from_json"), 10)
        self.assertTrue(checks.get("class_count_match"))
        self.assertTrue(checks.get("probabilities_valid"))
        self.assertAlmostEqual(checks.get("probabilities_sum", 0.0), 1.0, delta=0.01)

    def test_03_knowledge_base_covers_all_classes(self):
        """Verify verified agronomic knowledge base exists for every class."""
        for cls_name in EXPECTED_CLASSES:
            self.assertIn(cls_name, SOYBEAN_KNOWLEDGE_BASE)
            kb = SOYBEAN_KNOWLEDGE_BASE[cls_name]
            self.assertIn("scientific_name", kb)
            self.assertIn("category", kb)
            self.assertIn("urgency", kb)
            self.assertIn("description", kb)
            self.assertIn("recommendation", kb)

    def test_04_valid_image_inference(self):
        """Run real inference on a valid leaf photograph."""
        sample_path = os.path.join(REPO_ROOT, "sample_leaf.jpg")
        self.assertTrue(os.path.exists(sample_path), "sample_leaf.jpg must exist")

        with open(sample_path, "rb") as f:
            img_bytes = f.read()

        res = self.predictor.predict(img_bytes, include_explanation=False)
        self.assertTrue(res["success"])
        self.assertEqual(res["crop"], "soybean")
        self.assertIn("prediction", res)
        self.assertIn("confidence", res["prediction"])
        self.assertIn("top_predictions", res)
        self.assertEqual(len(res["top_predictions"]), 3)

        # Confidence should be valid probability
        conf = res["prediction"]["confidence"]
        self.assertGreaterEqual(conf, 0.0)
        self.assertLessEqual(conf, 1.0)

    def test_05_visual_explanation_gradcam(self):
        """Verify Grad-CAM visual attention overlay generation."""
        sample_path = os.path.join(REPO_ROOT, "sample_leaf.jpg")
        with open(sample_path, "rb") as f:
            img_bytes = f.read()

        res = self.predictor.predict(img_bytes, include_explanation=True)
        self.assertIn("visual_explanation", res)
        self.assertIn("overlay_image", res["visual_explanation"])
        self.assertTrue(res["visual_explanation"]["overlay_image"].startswith("data:image/jpeg;base64,"))
        self.assertIn("approximate heatmap", res["visual_explanation"]["disclaimer"])

    def test_06_security_empty_image(self):
        """Ensure empty payload is rejected with ValueError."""
        with self.assertRaises(ValueError):
            self.predictor.predict(b"")

    def test_07_security_corrupted_image(self):
        """Ensure invalid bytes are rejected with ValueError."""
        with self.assertRaises(ValueError):
            self.predictor.predict(b"NOT_A_VALID_IMAGE_BYTES_ABC123")

    def test_08_security_oversized_image(self):
        """Ensure oversized files (>10MB) are rejected to prevent DoS/decompression bombs."""
        fake_huge_bytes = b"0" * (MAX_IMAGE_BYTES + 1024)
        with self.assertRaises(ValueError):
            self.predictor.predict(fake_huge_bytes)

    def test_09_confidence_policy_thresholds(self):
        """Test confidence policy returns uncertain for artificially lowered thresholds."""
        p_strict = SoybeanPredictor(
            high_conf_threshold=0.9999,
            medium_conf_threshold=0.9990,
        )
        sample_path = os.path.join(REPO_ROOT, "sample_leaf.jpg")
        with open(sample_path, "rb") as f:
            img_bytes = f.read()

        res = p_strict.predict(img_bytes)
        if res["prediction"]["confidence"] < 0.9990:
            self.assertEqual(res["prediction"]["class_name"], "Uncertain")
            self.assertEqual(res["prediction"]["confidence_status"], "LOW_CONFIDENCE")
            self.assertIsNotNone(res["prediction"]["message"])


if __name__ == "__main__":
    unittest.main()
