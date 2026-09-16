import cv2
import numpy as np
from typing import Dict, Any

class ImageQualityService:
    def __init__(self):
        self.min_resolution = (224, 224)
        self.blur_threshold = 100.0  # Variance of Laplacian

    def assess_quality(self, image_bytes: bytes) -> Dict[str, Any]:
        """
        Assesses image quality for diagnosis.
        Returns PASS, LOW_QUALITY, INSUFFICIENT_EVIDENCE, or INVALID_IMAGE.
        """
        try:
            nparr = np.frombuffer(image_bytes, np.uint8)
            img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
            
            if img is None:
                return {
                    "quality_status": "INVALID_IMAGE",
                    "quality_score": 0.0,
                    "issues": ["Could not decode image"]
                }
            
            h, w = img.shape[:2]
            if h < self.min_resolution[0] or w < self.min_resolution[1]:
                return {
                    "quality_status": "LOW_QUALITY",
                    "quality_score": 0.3,
                    "issues": [f"Resolution too low: {w}x{h}"]
                }

            gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
            fm = cv2.Laplacian(gray, cv2.CV_64F).var()
            
            issues = []
            score = 1.0
            status = "PASS"
            
            if fm < self.blur_threshold:
                issues.append(f"Image is too blurry (score: {fm:.1f})")
                score = min(score, 0.4)
                status = "LOW_QUALITY"

            # Add basic brightness check
            mean_brightness = np.mean(gray)
            if mean_brightness < 40:
                issues.append("Image is too dark")
                score = min(score, 0.5)
                status = "LOW_QUALITY"
            elif mean_brightness > 220:
                issues.append("Image is overexposed")
                score = min(score, 0.5)
                status = "LOW_QUALITY"

            if score > 0.8:
                score = min(1.0, 0.8 + (fm / 1000.0) * 0.2)  # Cap at 1.0

            return {
                "quality_status": status,
                "quality_score": round(score, 2),
                "issues": issues
            }
            
        except Exception as e:
            return {
                "quality_status": "INVALID_IMAGE",
                "quality_score": 0.0,
                "issues": [f"Error processing image: {str(e)}"]
            }

image_quality_service = ImageQualityService()
