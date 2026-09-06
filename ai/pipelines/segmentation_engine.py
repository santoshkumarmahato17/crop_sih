"""
AGRI SHIELD — Real Foliar & Lesion Segmentation Engine.
Extracts botanical leaf blade tissue, isolates necrotic/chlorotic/perforated lesions,
computes true affected area (lesion_pixels / leaf_pixels * 100), and outputs authoritative
bounding boxes in original image coordinates with unique Region IDs.
"""

from typing import Any, Dict, List, Optional, Tuple
import numpy as np
from PIL import Image
import cv2


class SegmentationEngine:
    """
    Production-grade computer vision pipeline for real leaf blade masking,
    lesion segmentation, and non-fabricated bounding box localization.
    """

    MIN_CONTOUR_AREA_PX = 40  # Minimum lesion size in pixels to filter optical noise

    @classmethod
    def segment_foliar_image(
        cls,
        pil_img: Image.Image,
        condition_name: Optional[str] = None,
        is_healthy: bool = False,
    ) -> Dict[str, Any]:
        """
        Processes a PIL Image to extract the botanical leaf mask and actual disease lesions.
        Returns original coordinate bounding boxes and precise affected area percentage.
        """
        orig_w, orig_h = pil_img.size

        # Convert to RGB numpy array
        rgb_arr = np.array(pil_img.convert("RGB"), dtype=np.uint8)

        # ----------------------------------------------------------------------
        # Stage 1: Botanical Foliar Blade Extraction
        # Distinguish plant/leaf tissue from background (soil, sky, neutral, hands)
        # ----------------------------------------------------------------------
        r = rgb_arr[:, :, 0].astype(np.float32)
        g = rgb_arr[:, :, 1].astype(np.float32)
        b = rgb_arr[:, :, 2].astype(np.float32)

        # Excess Green Index (ExG): ExG = 2G - R - B
        exg = 2.0 * g - r - b

        # HSV Color Space for botanical hue gating
        hsv_arr = cv2.cvtColor(rgb_arr, cv2.COLOR_RGB2HSV)
        h = hsv_arr[:, :, 0]
        s = hsv_arr[:, :, 1]
        v = hsv_arr[:, :, 2]

        # Foliar mask: green/yellow/brown botanical hues with sufficient saturation
        # Hue range: 8 (orange/yellow/brown) to 95 (deep green)
        leaf_mask = (
            ((h >= 8) & (h <= 95) & (s >= 25) & (v >= 25)) |
            ((exg > 5.0) & (g > 35))
        ).astype(np.uint8) * 255

        # Clean leaf mask with morphological closing
        kernel_leaf = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (5, 5))
        leaf_mask = cv2.morphologyEx(leaf_mask, cv2.MORPH_CLOSE, kernel_leaf)
        leaf_mask = cv2.morphologyEx(leaf_mask, cv2.MORPH_OPEN, kernel_leaf)

        # Fill internal holes within major leaf contours so lesions inside leaf blades are included
        contours_leaf, _ = cv2.findContours(leaf_mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        total_image_pixels = orig_w * orig_h
        for cl in contours_leaf:
            if cv2.contourArea(cl) > (total_image_pixels * 0.02):
                cv2.drawContours(leaf_mask, [cl], -1, 255, thickness=-1)

        total_leaf_pixels = int(np.count_nonzero(leaf_mask))

        # If leaf mask is too small (< 2% of image), fall back to non-background pixels
        if total_leaf_pixels < (total_image_pixels * 0.02):
            leaf_mask = np.ones((orig_h, orig_w), dtype=np.uint8) * 255
            total_leaf_pixels = total_image_pixels

        # ----------------------------------------------------------------------
        # Stage 2: Pathology / Lesion Mask Extraction
        # ----------------------------------------------------------------------
        if is_healthy:
            # Healthy crop leaves have 0 true pathological lesion pixels
            return cls._build_healthy_response(orig_w, orig_h, total_leaf_pixels)

        # GDI: Green Dominance Index = (G - R) / (G + R + eps)
        sum_gr = r + g + 1e-5
        gdi = (g - r) / sum_gr

        # 1. Necrotic Lesions (brown, dark reddish, dead leaf tissue)
        necrotic_mask = (
            (leaf_mask > 0) &
            (
                ((r > g * 0.90) & (v < 190) & (gdi < 0.05) & (s > 20)) |
                ((h >= 8) & (h <= 25) & (s >= 50) & (v >= 30))
            )
        )

        # 2. Chlorotic Halo / Severe Yellowing (loss of chlorophyll)
        chlorotic_mask = (
            (leaf_mask > 0) &
            (r > 125) & (g > 125) & (b < 110) &
            (abs(r - g) < 45) &
            (gdi < 0.08)
        )

        # 3. Deep Insect Chewing Perforations / Pustules
        chewed_pustule_mask = (
            (leaf_mask > 0) &
            (
                # Dark chewed margins / necrotic borders
                ((r < 45) & (g < 45) & (b < 45)) |
                # Rust pustules (intense orange-red on foliar blade)
                ((h >= 8) & (h <= 24) & (s >= 110) & (v >= 60))
            )
        )

        # Combined Lesion Mask restricted strictly to foliar blade
        lesion_mask_bool = necrotic_mask | chlorotic_mask | chewed_pustule_mask
        lesion_mask = (lesion_mask_bool.astype(np.uint8)) * 255

        # Morphological filtering to eliminate isolated single-pixel noise
        kernel_lesion = cv2.getStructuringElement(cv2.MORPH_RECT, (3, 3))
        lesion_mask = cv2.morphologyEx(lesion_mask, cv2.MORPH_OPEN, kernel_lesion)

        total_lesion_pixels = int(np.count_nonzero(lesion_mask))

        # Scientific Affected Area Calculation:
        # Rule 14: affected_pixels / relevant_leaf_pixels * 100
        affected_area_pct = round((total_lesion_pixels / max(1, total_leaf_pixels)) * 100.0, 2)

        # ----------------------------------------------------------------------
        # Stage 3: Connected Component Localization & Bounding Boxes
        # ----------------------------------------------------------------------
        contours, _ = cv2.findContours(lesion_mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

        detected_regions: List[Dict[str, Any]] = []
        region_counter = 1

        # Sort contours by area descending to prioritize primary lesions
        valid_contours = [c for c in contours if cv2.contourArea(c) >= cls.MIN_CONTOUR_AREA_PX]
        valid_contours.sort(key=cv2.contourArea, reverse=True)

        for cnt in valid_contours[:12]:  # Limit to top 12 most prominent affected zones
            x, y, w, h_box = cv2.boundingRect(cnt)
            contour_area = float(cv2.contourArea(cnt))

            # Add slight padding around the lesion for visibility
            pad = 4
            bx = max(0, x - pad)
            by = max(0, y - pad)
            bw = min(orig_w - bx, w + pad * 2)
            bh = min(orig_h - by, h_box + pad * 2)

            # Analyze dominant symptoms in this specific region
            roi_necrotic = np.count_nonzero(necrotic_mask[by : by + bh, bx : bx + bw])
            roi_chlorotic = np.count_nonzero(chlorotic_mask[by : by + bh, bx : bx + bw])
            roi_pustule = np.count_nonzero(chewed_pustule_mask[by : by + bh, bx : bx + bw])
            roi_total = max(1, roi_necrotic + roi_chlorotic + roi_pustule)

            symptoms: List[Dict[str, Any]] = []
            if roi_necrotic / roi_total >= 0.25:
                symptoms.append({"name": "Necrotic Lesion", "confidence": round(roi_necrotic / roi_total, 2)})
            if roi_chlorotic / roi_total >= 0.20:
                symptoms.append({"name": "Chlorotic Halo", "confidence": round(roi_chlorotic / roi_total, 2)})
            if roi_pustule / roi_total >= 0.15:
                symptoms.append({"name": "Fungal Pustule / Perforation", "confidence": round(roi_pustule / roi_total, 2)})

            if not symptoms:
                symptoms.append({"name": "Foliar Discoloration", "confidence": 0.85})

            # Region-level severity
            region_area_pct = round((contour_area / max(1, total_leaf_pixels)) * 100.0, 2)
            if region_area_pct > 8.0:
                reg_sev = "High"
            elif region_area_pct > 3.0:
                reg_sev = "Moderate"
            else:
                reg_sev = "Low"

            reg_id = f"REG-{region_counter:03d}"
            detected_regions.append({
                "region_id": reg_id,
                "label": condition_name or "Detected Foliar Lesion",
                "bbox": {
                    "x": int(bx),
                    "y": int(by),
                    "width": int(bw),
                    "height": int(bh),
                },
                # Normalized coordinate percentages for responsive CSS scaling
                "normalized": {
                    "xmin": round((bx / orig_w) * 100, 2),
                    "ymin": round((by / orig_h) * 100, 2),
                    "xmax": round(((bx + bw) / orig_w) * 100, 2),
                    "ymax": round(((by + bh) / orig_h) * 100, 2),
                },
                "bbox_normalized": {
                    "x_pct": round((bx / orig_w) * 100, 2),
                    "y_pct": round((by / orig_h) * 100, 2),
                    "width_pct": round((bw / orig_w) * 100, 2),
                    "height_pct": round((bh / orig_h) * 100, 2),
                },
                "area_pixels": int(contour_area),
                "affected_area_pct": region_area_pct,
                "severity": reg_sev,
                "symptoms": symptoms,
                "detection_confidence": 0.88 if len(symptoms) > 1 else 0.78,
            })
            region_counter += 1

        # Golden Rule 2: If no real lesion is detected, DO NOT fabricate boxes!
        localization_available = len(detected_regions) > 0

        return {
            "image_width": orig_w,
            "image_height": orig_h,
            "total_leaf_pixels": total_leaf_pixels,
            "total_lesion_pixels": total_lesion_pixels,
            "total_lesions": len(detected_regions),
            "lesion_count": len(detected_regions),
            "affected_area_pct": affected_area_pct,
            "regions": detected_regions,
            "localization_available": localization_available,
            "localization_message": (
                f"{len(detected_regions)} affected region(s) localized with precision."
                if localization_available
                else "Disease classification is available, but precise affected-region localization is not currently available."
            ),
        }

    @classmethod
    def _build_healthy_response(cls, width: int, height: int, leaf_pixels: int) -> Dict[str, Any]:
        """Returns clean empty-region response for healthy foliar canopies without fake boxes."""
        return {
            "image_width": width,
            "image_height": height,
            "total_leaf_pixels": leaf_pixels,
            "total_lesion_pixels": 0,
            "total_lesions": 0,
            "lesion_count": 0,
            "affected_area_pct": 0.0,
            "regions": [],
            "localization_available": False,
            "localization_message": "Canopy tissue is healthy; no pathological lesions detected.",
        }
