"""
Verification Script for Cashew Leaf Disease & Pest Predictor.
Runs inference on unseen test samples from each of the 5 classes:
- Anthracnose (Disease)
- Gummosis (Disease)
- Healthy (Healthy)
- Leaf Miner (Pest)
- Red Rust (Disease)
And simulates real-world camera conditions (angles, blur, low/high brightness).
"""

import os
import sys
from PIL import Image, ImageEnhance, ImageFilter

REPO_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "../.."))
if REPO_ROOT not in sys.path:
    sys.path.insert(0, REPO_ROOT)

from ml.src.utils import load_json
from ml.src.predict_cashew import CashewLeafPredictor


def main():
    print("=" * 75)
    print(" CASHEW LEAF PREDICTION TEST ON UNSEEN HELD-OUT TEST SAMPLES")
    print("=" * 75)

    test_split_path = os.path.join(REPO_ROOT, "ml", "data", "splits_cashew", "test.json")
    if not os.path.exists(test_split_path):
        print(f"Error: Test split not found at {test_split_path}")
        return

    test_samples = load_json(test_split_path)
    predictor = CashewLeafPredictor()

    classes = ["Anthracnose", "Gummosis", "Healthy", "Leaf Miner", "Red Rust"]
    samples_to_test = []
    for cls in classes:
        cls_samples = [s for s in test_samples if s["class_name"] == cls]
        samples_to_test.extend(cls_samples[:3])

    correct_count = 0
    total_count = len(samples_to_test)

    print(f"\n[Part 1] Testing {total_count} held-out test samples across all 5 classes:\n")

    for idx, item in enumerate(samples_to_test, 1):
        actual_class = item["class_name"]
        filepath = item["filepath"]

        res = predictor.predict(filepath)
        pred_class = res["predicted_class_raw"]
        confidence = res["confidence"]
        status = res["status"]
        category = res["category"]
        is_correct = pred_class == actual_class

        if is_correct:
            correct_count += 1
            result_tag = "YES [CORRECT]"
        else:
            result_tag = "NO [MISMATCH]"

        print(f"Test #{idx:02d}:")
        print(f"  File       : {os.path.basename(filepath)}")
        print(f"  Actual     : {actual_class}")
        print(f"  Predicted  : {pred_class} ({category.upper()})")
        print(f"  Confidence : {confidence}% ({status})")
        print(f"  Correct    : {result_tag}")
        print()

    accuracy = (correct_count / total_count) * 100
    print("=" * 75)
    print(f"Baseline Test Accuracy: {correct_count}/{total_count} ({accuracy:.1f}%)")
    print("=" * 75)

    # --------------------------------------------------------------------------
    # Part 2: Robustness Under Varied Phone Camera Conditions
    # --------------------------------------------------------------------------
    print("\n[Part 2] Evaluating Robustness Under Varied Outdoor Camera Conditions:")
    print("-" * 75)

    test_sample = samples_to_test[0]
    base_img = Image.open(test_sample["filepath"]).convert("RGB")
    actual_label = test_sample["class_name"]

    scenarios = [
        ("Bright Outdoor Lighting (Overcast/Direct Sun)", ImageEnhance.Brightness(base_img).enhance(1.25)),
        ("Low Ambient Lighting (Shaded Canopy)", ImageEnhance.Brightness(base_img).enhance(0.75)),
        ("High Contrast (Harsh Sunlight)", ImageEnhance.Contrast(base_img).enhance(1.3)),
        ("Low Contrast (Diffused Morning Light)", ImageEnhance.Contrast(base_img).enhance(0.8)),
        ("Angled Leaf View (30 Degree Perspective Tilt)", base_img.rotate(30, expand=False)),
        ("Slight Hand Blur (Subtle Motion Blur)", base_img.filter(ImageFilter.GaussianBlur(radius=0.8))),
        ("Reduced Resolution (Mobile Camera Digital Zoom)", base_img.resize((150, 150)).resize((400, 400))),
    ]

    for condition_name, transformed_img in scenarios:
        res = predictor.predict(transformed_img)
        pred = res["predicted_class_raw"]
        conf = res["confidence"]
        rel = "Reliable" if res["reliable"] else "Uncertain"
        match = "YES" if pred == actual_label else "NO"
        print(f"  Condition : {condition_name:<45}")
        print(f"    Predicted: {pred} | Conf: {conf:.2f}% ({rel}) | Match: {match}")
        print()

    print("=" * 75)
    print("[Success] All unseen test scenarios and camera robustness evaluations completed!")
    print("=" * 75)


if __name__ == "__main__":
    main()
