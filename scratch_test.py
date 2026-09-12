import sys
import os
import cv2

REPO_ROOT = os.path.dirname(os.path.abspath(__file__))
if REPO_ROOT not in sys.path:
    sys.path.insert(0, REPO_ROOT)

from ml.src.yolo_disease_detector import YOLODiseaseDetector

def main():
    try:
        detector = YOLODiseaseDetector()
        # Read the sample image
        with open(os.path.join(REPO_ROOT, "sample_leaf.jpg"), "rb") as f:
            contents = f.read()
            
        print("Analyzing...")
        result = detector.analyze(contents)
        print("Success!", result.keys())
    except Exception as e:
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    main()
