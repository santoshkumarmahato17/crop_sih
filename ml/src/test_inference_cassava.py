"""
Verification Script for Cassava Leaf Disease & Pest Predictor.
Runs inference on unseen test samples from each of the 5 classes:
- Bacterial Blight (Disease)
- Brown Spot (Disease)
- Green Mite (Pest)
- Healthy (Healthy)
- Mosaic (Disease)
"""

import os
import sys

REPO_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "../.."))
if REPO_ROOT not in sys.path:
    sys.path.insert(0, REPO_ROOT)

from ml.src.utils import load_json
from ml.src.predict_cassava import CassavaLeafPredictor


def main():
    print("=" * 70)
    print(" CASSAVA LEAF PREDICTION TEST ON UNSEEN HELD-OUT TEST SAMPLES")
    print("=" * 70)

    test_split_path = os.path.join(REPO_ROOT, "ml", "data", "splits_cassava", "test.json")
    if not os.path.exists(test_split_path):
        print(f"Error: Test split not found at {test_split_path}")
        return

    test_samples = load_json(test_split_path)
    predictor = CassavaLeafPredictor()

    # Pick 2-3 samples per class
    classes = ["Bacterial Blight", "Brown Spot", "Green Mite", "Healthy", "Mosaic"]
    samples_to_test = []
    for cls in classes:
        cls_samples = [s for s in test_samples if s["class_name"] == cls]
        samples_to_test.extend(cls_samples[:3])

    correct_count = 0
    total_count = len(samples_to_test)

    print(f"Testing {total_count} held-out test samples across all 5 classes:\n")

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
    print("=" * 70)
    print(f"Summary: {correct_count}/{total_count} correct ({accuracy:.1f}% sample accuracy)")
    print("=" * 70)


if __name__ == "__main__":
    main()
