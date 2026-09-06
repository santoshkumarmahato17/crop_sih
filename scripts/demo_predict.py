"""
AGRI SHIELD — CLI Demonstration for Crop Pathology Vision Model.
Executes diagnosis on a test image and displays structured JSON, risk advisory,
and saves a Grad-CAM lesion explainability overlay.
"""

import os
import sys
import json
import argparse
from PIL import Image

# Ensure repository root in sys.path
REPO_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if REPO_ROOT not in sys.path:
    sys.path.insert(0, REPO_ROOT)

from ai.inference import (
    CropDiseasePredictor,
    compute_agronomic_risk_and_advisory,
)


def create_sample_leaf_image(path: str = "sample_leaf.jpg") -> str:
    """Generates a synthetic sample leaf image with simulated disease lesion."""
    img = Image.new("RGB", (256, 256), color=(40, 160, 45))
    # Simulated necrotic brown lesion
    for x in range(90, 150):
        for y in range(80, 140):
            # Halo and lesion core
            dist = ((x - 120) ** 2 + (y - 110) ** 2) ** 0.5
            if dist < 22:
                img.putpixel((x, y), (145, 85, 30))  # Necrotic center
            elif dist < 32:
                img.putpixel((x, y), (190, 175, 40))  # Chlorotic halo
    img.save(path)
    return path


def main():
    parser = argparse.ArgumentParser(description="Crop Disease AI Predictor CLI Demo")
    parser.add_argument("--image", type=str, default=None, help="Path to input crop image")
    parser.add_argument("--backbone", type=str, default="efficientnet_b0", help="CNN Backbone")
    parser.add_argument("--weights", type=str, default=None, help="Path to custom model weights")
    parser.add_argument("--stage", type=str, default="booting", help="Crop stage")
    parser.add_argument("--temp", type=float, default=28.5, help="Temperature in °C")
    parser.add_argument("--humidity", type=float, default=85.0, help="Relative humidity %")
    parser.add_argument("--rainfall", type=float, default=10.0, help="Precipitation in mm")
    parser.add_argument("--gradcam", action="store_true", help="Generate Grad-CAM visualization")
    args = parser.parse_args()

    image_path = args.image
    if not image_path or not os.path.isfile(image_path):
        print("[CLI Demo] No image specified. Generating synthetic leaf image...")
        image_path = create_sample_leaf_image("sample_leaf.jpg")

    print("=" * 70)
    print(" AGRI SHIELD — CROP HEALTH VISION AI INFERENCE")
    print("=" * 70)
    print(f"Input Image:   {image_path}")
    print(f"Backbone:      {args.backbone.upper()}")
    print(f"Weather:       Temp={args.temp}°C, Humidity={args.humidity}%, Rain={args.rainfall}mm")
    print(f"Crop Stage:    {args.stage.capitalize()}")
    print("-" * 70)

    # Initialize predictor
    predictor = CropDiseasePredictor(
        weights_path=args.weights,
        backbone_name=args.backbone,
    )

    # Run inference
    result = predictor.predict(
        image_input=image_path,
        top_k=3,
        include_gradcam=args.gradcam,
    )

    # Compute agronomic risk & advisory
    weather = {
        "temperature_c": args.temp,
        "humidity_percent": args.humidity,
        "rainfall_mm": args.rainfall,
    }
    advisory = compute_agronomic_risk_and_advisory(
        prediction=result,
        weather=weather,
        crop_stage=args.stage,
    )
    result["agronomic_advisory"] = advisory

    # If base64 heatmap present, truncate for pretty printing
    print_dict = dict(result)
    if "explanation_heatmap_base64" in print_dict:
        b64_len = len(print_dict["explanation_heatmap_base64"])
        print_dict["explanation_heatmap_base64"] = f"<Base64 PNG URI: {b64_len} chars>"

    print("\nDIAGNOSIS REPORT (JSON):")
    print(json.dumps(print_dict, indent=2))
    print("=" * 70)


if __name__ == "__main__":
    main()
