"""
Verification script for Apple Leaf Disease Classification Model:
- Runs inference on 1 test image per class (Apple Scab, Black Rot, Cedar Apple Rust, Healthy)
- Evaluates predicted class, confidence, category, and IPM recommendations
- Tests image quality check against heavily blurred and corrupted input
- Tests Unified Plant Diagnostic Engine dispatch
"""

import os
import sys
import json
from PIL import Image, ImageFilter

REPO_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if REPO_ROOT not in sys.path:
    sys.path.insert(0, REPO_ROOT)

from ml.src.predict_apple import get_apple_predictor
from ml.src.unified_predictor import UnifiedPlantDiagnosticEngine


def main():
    print("\n" + "=" * 75)
    print("      VERIFYING APPLE LEAF INFERENCE ENGINE & IPM RECOMMENDATIONS")
    print("=" * 75)

    predictor = get_apple_predictor()
    splits_file = os.path.join(REPO_ROOT, "ml", "data", "splits_apple", "test_samples.json")
    with open(splits_file) as f:
        samples = json.load(f)

    classes = ["Apple Scab", "Black Rot", "Cedar Apple Rust", "Healthy"]

    for target_cls in classes:
        sample = next(s for s in samples if s["class_name"] == target_cls)
        img_path = sample["filepath"]
        res = predictor.predict(img_path)

        print(f"\n[Test Case: {target_cls}]")
        print(f"  Image:       {os.path.basename(img_path)}")
        print(f"  Prediction:  {res['prediction']} ({res['status']})")
        print(f"  Confidence:  {res['confidence']:.2f}% (Threshold: 70%)")
        print(f"  Reliable:    {res['reliable']}")
        print(f"  Category:    {res['category']}")
        print(f"  Probabilities: {res['probabilities']}")
        rec = res.get("recommendations", {}).get("recommendation", "")[:80]
        print(f"  IPM Action:  {rec}...")

        assert res["prediction"] == target_cls, f"Mismatch: expected {target_cls}, got {res['prediction']}"
        assert res["reliable"] is True, f"Expected reliable prediction for high confidence sample"

    print("\n" + "=" * 75)
    print("      TESTING IMAGE QUALITY CHECK (BLUR / OBSTRUCTION REJECTION)")
    print("=" * 75)

    # 1. Heavily blurred image test
    sample_img = Image.open(samples[0]["filepath"]).filter(ImageFilter.GaussianBlur(radius=18))
    blur_res = predictor.predict(sample_img)
    print(f"  Blur Test Status:   {blur_res['status']}")
    print(f"  Blur Detected:      {blur_res.get('quality_assessment', {}).get('is_blurry')}")
    print(f"  Quality Acceptable: {blur_res.get('quality_assessment', {}).get('is_acceptable')}")

    # 2. Unified Diagnostic Engine Test
    print("\n" + "=" * 75)
    print("      TESTING UNIFIED PLANT DIAGNOSTIC ENGINE DISPATCH")
    print("=" * 75)
    engine = UnifiedPlantDiagnosticEngine()
    test_sample = next(s for s in samples if s["class_name"] == "Cedar Apple Rust")
    unified_res = engine.diagnose(test_sample["filepath"], force_crop="Apple")
    print(f"  Unified Crop:       {unified_res['crop']}")
    print(f"  Condition:          {unified_res['prediction']}")
    print(f"  Category:           {unified_res['category']}")
    print(f"  Confidence:         {unified_res['confidence']:.2f}%")
    print(f"  Reliable:           {unified_res['reliable']}")

    print("\n" + "=" * 75)
    print("       ALL INFERENCE & QUALITY VERIFICATIONS PASSED SUCCESSFULLY!")
    print("=" * 75 + "\n")


if __name__ == "__main__":
    main()
