"""
AGRI SHIELD — Image Quality Diagnostic Engine.
Validates blur (Laplacian variance), exposure (histogram clipping), contrast (RMS),
and resolution before neural diagnosis to prevent false positive classifications.
"""

from typing import Any, Dict, Optional, Tuple, Union
import numpy as np
from PIL import Image
import cv2


class ImageQualityAnalyzer:
    """
    Evaluates image quality metrics to gate diagnosis on blurry, underexposed,
    overexposed, or severely degraded crop imagery.
    """

    # Quality Thresholds
    BLUR_THRESHOLD_UNUSABLE = 15.0      # Laplacian variance < 15 is severely blurred if edges are also soft
    BLUR_THRESHOLD_ACCEPTABLE = 45.0    # Laplacian variance 15-45 is moderately blurry
    MIN_IMAGE_DIMENSION = 120           # Minimum width/height in pixels
    UNDEREXPOSED_MEAN = 18.0            # Average luminance < 18 is severely underexposed
    OVEREXPOSED_MEAN = 242.0            # Average luminance > 242 is severely overexposed
    LOW_CONTRAST_STD = 4.0              # RMS contrast std < 4 is featureless / washed out

    @classmethod
    def evaluate_pil_image(cls, pil_img: Image.Image) -> Dict[str, Any]:
        """Evaluates image quality metrics on a PIL Image instance."""
        width, height = pil_img.size

        # Convert to RGB array
        rgb_arr = np.array(pil_img.convert("RGB"), dtype=np.uint8)

        # Convert to Grayscale for morphological & optical tests
        gray_arr = cv2.cvtColor(rgb_arr, cv2.COLOR_RGB2GRAY)

        # 1. Blur Detection (Laplacian Variance & Peak Edge Response)
        laplacian = cv2.Laplacian(gray_arr, cv2.CV_64F)
        blur_variance = float(np.var(laplacian))
        max_edge = float(np.max(np.abs(laplacian)))

        # 2. Exposure & Luminance
        mean_luminance = float(np.mean(gray_arr))
        # Highlight clipping: percentage of saturated pixels (> 250)
        overexposed_ratio = float(np.mean(gray_arr > 250))
        # Shadow clipping: percentage of dark pixels (< 10)
        underexposed_ratio = float(np.mean(gray_arr < 10))

        # 3. Contrast (Root Mean Square Contrast)
        contrast_std = float(np.std(gray_arr))

        # 4. Foliar/Plant Presence Check (Excess Green: ExG = 2G - R - B)
        r = rgb_arr[:, :, 0].astype(np.float32)
        g = rgb_arr[:, :, 1].astype(np.float32)
        b = rgb_arr[:, :, 2].astype(np.float32)
        exg = 2 * g - r - b
        foliar_ratio = float(np.mean((exg > 5) | (g > r * 1.02)))

        # Evaluate Resolution
        if width < cls.MIN_IMAGE_DIMENSION or height < cls.MIN_IMAGE_DIMENSION:
            resolution_status = "INSUFFICIENT"
        elif width < 256 or height < 256:
            resolution_status = "LOW"
        else:
            resolution_status = "SUFFICIENT"

        # Determine Usability & Categorical Status
        is_usable = True
        warnings = []
        score = 1.0

        # Blur penalties (genuine optical blur lacks both variance and sharp peak edge transitions)
        if blur_variance < cls.BLUR_THRESHOLD_UNUSABLE and max_edge < 25.0:
            is_usable = False
            warnings.append("Severe motion or optical blur detected.")
            score -= 0.55
        elif blur_variance < cls.BLUR_THRESHOLD_ACCEPTABLE and max_edge < 50.0:
            score -= 0.20
            warnings.append("Moderate blur; fine lesion structures may be indistinct.")

        # Exposure penalties
        if mean_luminance < cls.UNDEREXPOSED_MEAN or underexposed_ratio > 0.75:
            is_usable = False
            warnings.append("Severe underexposure; foliar canopy is too dark.")
            score -= 0.50
        elif mean_luminance > cls.OVEREXPOSED_MEAN or overexposed_ratio > 0.70:
            is_usable = False
            warnings.append("Severe overexposure; leaf surface details are blown out.")
            score -= 0.50

        # Contrast penalties
        if contrast_std < cls.LOW_CONTRAST_STD and max_edge < 20.0:
            score -= 0.25
            warnings.append("Low contrast; image details are washed out.")

        # Resolution penalty
        if resolution_status == "INSUFFICIENT":
            is_usable = False
            warnings.append("Image resolution is below the minimum required 120x120 pixels.")
            score -= 0.60

        # Foliar visibility penalty
        if foliar_ratio < 0.02 and is_usable:
            score -= 0.25
            warnings.append("Minimal vegetative/foliar tissue detected in scene.")

        # Bound score between 0.0 and 1.0
        score = max(0.05, min(1.0, round(score, 2)))

        if not is_usable or score < 0.35:
            status = "UNUSABLE"
            warning_msg = (
                "The image quality is insufficient for reliable diagnosis. "
                "Please upload a clearer image focused on the affected plant/leaf."
            )
        elif score < 0.60:
            status = "POOR"
            warning_msg = "Image quality is suboptimal; diagnosis should be validated by an expert."
        elif score < 0.80:
            status = "ACCEPTABLE"
            warning_msg = None
        else:
            status = "GOOD"
            warning_msg = None

        return {
            "score": score,
            "status": status,
            "is_usable": is_usable and (status != "UNUSABLE"),
            "blur_variance": round(blur_variance, 1),
            "mean_luminance": round(mean_luminance, 1),
            "contrast_std": round(contrast_std, 1),
            "resolution_status": resolution_status,
            "image_dimensions": {"width": width, "height": height},
            "foliar_ratio": round(foliar_ratio, 3),
            "warning_message": warning_msg,
            "diagnostic_warnings": warnings,
        }
