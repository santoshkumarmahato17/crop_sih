"""
AGRI SHIELD — Large Image Streaming & Tiled ROI Processing Pipeline.
Handles ultra-high-resolution images (up to 200MB / 6000x4000 drone imagery)
without memory exhaustion or lesion obliteration via overlapping tiled inference and NMS.
"""

import io
from typing import Any, Callable, Dict, List, Optional, Tuple
import numpy as np
from PIL import Image, ImageOps


class TiledInferenceEngine:
    """
    Manages tiled inference over large multi-megapixel agricultural photographs.
    Slices images into overlapping windows, runs sub-region detection,
    and maps bounding boxes back to global original coordinates with Non-Maximum Suppression.
    """

    DEFAULT_TILE_SIZE = 640
    DEFAULT_TILE_OVERLAP = 0.15  # 15% overlap across tile boundaries
    MAX_DIRECT_DIMENSION = 1600  # Images larger than this dimension trigger tiled processing

    @classmethod
    def safe_load_and_orient(cls, image_bytes: bytes) -> Image.Image:
        """
        Safely decodes image bytes and corrects EXIF orientation (e.g. from mobile cameras).
        """
        try:
            with Image.open(io.BytesIO(image_bytes)) as img:
                # Apply EXIF rotation if present
                oriented = ImageOps.exif_transpose(img)
                return oriented.convert("RGB")
        except Exception as e:
            raise ValueError(f"Failed to safely decode and orient image bytes: {e}")

    @classmethod
    def process_large_image(
        cls,
        pil_img: Image.Image,
        inference_fn: Optional[Callable[[Image.Image], Dict[str, Any]]] = None,
        tile_size: int = DEFAULT_TILE_SIZE,
        tile_overlap: Optional[float] = None,
        **kwargs,
    ) -> Dict[str, Any]:
        """
        Processes an image either directly or via overlapping tiles if dimensions exceed threshold.
        """
        orig_w, orig_h = pil_img.size

        # Resolve overlap parameter (fraction or absolute pixel count)
        overlap_val = kwargs.get("overlap") if kwargs.get("overlap") is not None else tile_overlap
        if overlap_val is None:
            overlap_pct = cls.DEFAULT_TILE_OVERLAP
        elif isinstance(overlap_val, (int, float)) and overlap_val > 1.0:
            overlap_pct = float(overlap_val / tile_size)
        else:
            overlap_pct = float(overlap_val)

        # Default inference function if not passed
        if inference_fn is None:
            from ai.pipelines.segmentation_engine import SegmentationEngine
            cond_name = kwargs.get("condition_name", "Detected Foliar Lesion")
            is_hlth = kwargs.get("is_healthy", False)
            inference_fn = lambda img: SegmentationEngine.segment_foliar_image(img, condition_name=cond_name, is_healthy=is_hlth)

        # If image is manageable and dimensions do not exceed tile size, execute directly
        if max(orig_w, orig_h) <= cls.MAX_DIRECT_DIMENSION and (orig_w <= tile_size and orig_h <= tile_size):
            res = inference_fn(pil_img)
            res["is_tiled"] = False
            res["tiles_evaluated"] = 1
            res["image_dimensions"] = {"width": orig_w, "height": orig_h}
            return res

        # High-resolution or multi-tile image: compute overlapping tile coordinates
        step_x = max(50, int(tile_size * (1.0 - overlap_pct)))
        step_y = max(50, int(tile_size * (1.0 - overlap_pct)))

        x_coords = list(range(0, orig_w - tile_size + 1, step_x))
        if not x_coords or (x_coords[-1] + tile_size < orig_w):
            x_coords.append(max(0, orig_w - tile_size))

        y_coords = list(range(0, orig_h - tile_size + 1, step_y))
        if not y_coords or (y_coords[-1] + tile_size < orig_h):
            y_coords.append(max(0, orig_h - tile_size))

        all_raw_regions: List[Dict[str, Any]] = []
        condition_votes: Dict[str, float] = {}
        total_tiles = len(x_coords) * len(y_coords)

        # Process each tile sequentially to preserve memory
        for y0 in y_coords:
            for x0 in x_coords:
                x1 = min(orig_w, x0 + tile_size)
                y1 = min(orig_h, y0 + tile_size)
                tile = pil_img.crop((x0, y0, x1, y1))

                tile_result = inference_fn(tile)

                # Track condition votes
                cond = tile_result.get("label") or tile_result.get("condition")
                conf = float(tile_result.get("confidence", 0.0))
                if cond:
                    condition_votes[cond] = condition_votes.get(cond, 0.0) + conf

                # Translate tile-relative coordinates back to global image coordinates
                for reg in tile_result.get("regions", []):
                    bbox = reg.get("bbox", {})
                    global_x = x0 + bbox.get("x", 0)
                    global_y = y0 + bbox.get("y", 0)
                    global_w = bbox.get("width", 0)
                    global_h = bbox.get("height", 0)

                    all_raw_regions.append({
                        **reg,
                        "bbox": {
                            "x": int(global_x),
                            "y": int(global_y),
                            "width": int(global_w),
                            "height": int(global_h),
                        },
                    })

        # Non-Maximum Suppression (NMS) to merge overlapping detections across tiles
        merged_regions = cls._non_max_suppression(all_raw_regions, iou_threshold=0.35)

        # Re-number region IDs in global order
        for idx, r in enumerate(merged_regions, 1):
            r["region_id"] = f"REG-{idx:03d}"
            bx = r["bbox"]["x"]
            by = r["bbox"]["y"]
            bw = r["bbox"]["width"]
            bh = r["bbox"]["height"]
            r["normalized"] = {
                "xmin": round((bx / orig_w) * 100, 2),
                "ymin": round((by / orig_h) * 100, 2),
                "xmax": round(((bx + bw) / orig_w) * 100, 2),
                "ymax": round(((by + bh) / orig_h) * 100, 2),
            }

        # Determine dominant global condition
        dominant_cond = max(condition_votes, key=condition_votes.get) if condition_votes else "Unspecified"
        avg_conf = (condition_votes[dominant_cond] / max(1, total_tiles)) if condition_votes else 0.85

        return {
            "image_width": orig_w,
            "image_height": orig_h,
            "image_dimensions": {"width": orig_w, "height": orig_h},
            "is_tiled": True,
            "tiles_evaluated": total_tiles,
            "tiled_processing_applied": True,
            "total_tiles_evaluated": total_tiles,
            "dominant_condition": dominant_cond,
            "confidence": min(0.98, max(0.70, round(avg_conf, 2))),
            "regions": merged_regions,
            "localization_available": len(merged_regions) > 0,
        }

    @classmethod
    def _non_max_suppression(
        cls,
        regions: List[Dict[str, Any]],
        iou_threshold: float = 0.35,
    ) -> List[Dict[str, Any]]:
        """Removes overlapping duplicate detections using standard Intersection over Union (IoU)."""
        if not regions:
            return []

        # Sort by detection confidence or area descending
        sorted_regions = sorted(
            regions,
            key=lambda r: (r.get("detection_confidence", 0.5), r.get("area_pixels", 0)),
            reverse=True,
        )

        selected: List[Dict[str, Any]] = []

        for candidate in sorted_regions:
            cb = candidate["bbox"]
            c_box = (cb["x"], cb["y"], cb["x"] + cb["width"], cb["y"] + cb["height"])

            suppress = False
            for prev in selected:
                pb = prev["bbox"]
                p_box = (pb["x"], pb["y"], pb["x"] + pb["width"], pb["y"] + pb["height"])

                iou = cls._compute_iou(c_box, p_box)
                if iou >= iou_threshold:
                    suppress = True
                    break

            if not suppress:
                selected.append(candidate)

        return selected

    @staticmethod
    def _compute_iou(boxA: Tuple[int, int, int, int], boxB: Tuple[int, int, int, int]) -> float:
        """Computes IoU between two bounding boxes (x1, y1, x2, y2)."""
        xA = max(boxA[0], boxB[0])
        yA = max(boxA[1], boxB[1])
        xB = min(boxA[2], boxB[2])
        yB = min(boxA[3], boxB[3])

        inter_w = max(0, xB - xA)
        inter_h = max(0, yB - yA)
        inter_area = inter_w * inter_h

        boxA_area = (boxA[2] - boxA[0]) * (boxA[3] - boxA[1])
        boxB_area = (boxB[2] - boxB[0]) * (boxB[3] - boxB[1])

        union_area = float(boxA_area + boxB_area - inter_area)
        return (inter_area / union_area) if union_area > 0 else 0.0
