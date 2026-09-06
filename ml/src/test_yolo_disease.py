"""
Verification test for YOLODiseaseDetector on user uploaded reference images.
"""

import os
import sys

REPO_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
if REPO_ROOT not in sys.path:
    sys.path.insert(0, REPO_ROOT)

import json
from ml.src.yolo_disease_detector import YOLODiseaseDetector

def main():
    detector = YOLODiseaseDetector()
    user_upload_dir = r"C:\Users\krsan\.gemini\antigravity-ide\brain\6718f361-3189-4128-81f0-83686cf62f15\.user_uploaded"
    
    test_files = [
        "media_1788723231985.jpg",  # Figure 3 (YOLO red bounding boxes)
        "media_1788723120142.jpg",  # Figure 1 (Spectral false-color heatmap)
        "media_1788723183383.jpg",  # Figure 2 (Multi-region segmentation)
    ]

    for fname in test_files:
        fpath = os.path.join(user_upload_dir, fname)
        if not os.path.exists(fpath):
            print(f"Skipping {fname}: not found")
            continue
            
        print(f"\n=======================================================")
        print(f"Testing YOLODiseaseDetector on: {fname}")
        print(f"=======================================================")
        result = detector.analyze(fpath)
        
        print(f"Success: {result['success']}")
        print(f"Image Dimensions: {result['image_dimensions']}")
        print(f"Detected Lesions Count: {result['lesion_count']}")
        print(f"Severity Percentage: {result['severity_percentage']}% ({result['severity_level']})")
        print(f"Healthy Canopy Ratio: {result['healthy_area_pct']}%")
        print(f"Urgency / Action: {result['urgency']} - {result['status_tag']}")
        print(f"Detections sample (first 3):")
        for det in result['detections'][:3]:
            print(f"  - #{det['id']}: {det['label']} ({det['confidence']}%) Box: {det['box']}")
            
        # Verify layers
        layers = result["layers"]
        print(f"Layers generated:")
        for k in ["original", "yolo_bbox", "segmentation", "spectral_heatmap"]:
            b64_len = len(layers.get(k, ""))
            print(f"  - {k}: {b64_len} chars (starts with {layers.get(k, '')[:30]}...)")

if __name__ == "__main__":
    main()
