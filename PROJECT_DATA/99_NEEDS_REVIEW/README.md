# 99_NEEDS_REVIEW Directory

This directory contains documentation on items that require user review or manual decision.

## Items Identified for User Review:
1. **Duplicate Model**: `crop_model.pkl` in the repository root vs `weights/crop_model.pkl`
   - Both files are identical (3,568,334 bytes).
   - Currently, neither was deleted to prevent breaking potential manual scripts.
   - You may safely remove the root `crop_model.pkl` if desired, as `weights/crop_model.pkl` is the canonical location.
2. **Standalone YOLOv8 Segmentation Weights**: `yolov8n-seg.pt` (7,071,756 bytes)
   - Present in root directory.
   - Active inference currently utilizes `yolov8n.pt` for lesion bounding boxes.
   - Organized in `PROJECT_DATA/02_MODELS/YOLO/yolov8n-seg.pt` for future segmentation integration.
3. **Onion Dataset**: `onion d-set` (13,229 files)
   - Contains raw onion pathology images.
   - Not currently wired into an active API endpoint in `ml/api/app.py`.
   - Accessible in `PROJECT_DATA/01_DATASETS/ONION/` for model development.
