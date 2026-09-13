# APPLICATION REFERENCED FILES AUDIT

This document records all datasets, models, samples, and configurations that are **actively referenced** by the running application code (`backend/`, `ml/`, `frontend/`).

Under the **CRITICAL SAFETY DIRECTIVE**, these files have been **preserved in their original active locations** to guarantee zero downtime and 100% operational compatibility.

---

## 1. Actively Referenced Datasets
| Original Directory | Referencing Code Location | Purpose in Application | Safe Organization Method |
| :--- | :--- | :--- | :--- |
| `apple dataset/` | `ml/api/app.py:917`, `ml/src/dataset_apple.py:34` | Apple leaf disease test streaming & class taxonomy | Linked via NTFS Junction to `PROJECT_DATA/01_DATASETS/APPLE` |
| `Cashew/` | `ml/api/app.py:1027`, `ml/src/dataset_cashew.py:35` | Cashew pathology sample streaming | Linked via NTFS Junction to `PROJECT_DATA/01_DATASETS/CASHEW` |
| `Cassava/` | `ml/api/app.py:1027`, `ml/src/dataset_cassava.py:35` | Cassava pathology sample streaming | Linked via NTFS Junction to `PROJECT_DATA/01_DATASETS/CASSAVA` |
| `Maize/` | `ml/api/app.py:1027`, `ml/src/dataset_maize.py:35` | Maize pathology sample streaming | Linked via NTFS Junction to `PROJECT_DATA/01_DATASETS/MAIZE` |
| `Tomato/` | `ml/api/app.py:1027`, `ml/src/dataset.py:40` | Tomato pathology sample streaming | Linked via NTFS Junction to `PROJECT_DATA/01_DATASETS/TOMATO` |
| `orange d-set/` | `ml/inference/predictor.py:25` | Orange leaf classifier training base | Linked via NTFS Junction to `PROJECT_DATA/01_DATASETS/ORANGE` |
| `onion d-set/` | Dataset directory | Offline research & future extension | Linked via NTFS Junction to `PROJECT_DATA/01_DATASETS/ONION` |

---

## 2. Actively Referenced Models & Weights
| Model File | Original Location | Referencing Code Location | Status |
| :--- | :--- | :--- | :--- |
| `best_model.pth` | `ml/models_apple/best_model/` | `ml/src/predict_apple.py:45` | Preserved in original path + organized copy in `PROJECT_DATA/02_MODELS/APPLE/` |
| `apple_leaf_mobilenet_v3.pt` | `ml/models_apple/mobile_model/` | `ml/src/train_apple.py:180` | Preserved in original path + organized copy in `PROJECT_DATA/02_MODELS/APPLE/` |
| `best_model.pth` | `ml/models_cashew/best_model/` | `ml/src/predict_cashew.py:42` | Preserved in original path + organized copy in `PROJECT_DATA/02_MODELS/CASHEW/` |
| `best_model_mobile.pt` | `ml/models_cashew/best_model/` | `ml/src/export_cashew_artifacts.py:30` | Preserved in original path + organized copy in `PROJECT_DATA/02_MODELS/CASHEW/` |
| `best_model.pth` | `ml/models_cassava/best_model/` | `ml/src/predict_cassava.py:42` | Preserved in original path + organized copy in `PROJECT_DATA/02_MODELS/CASSAVA/` |
| `best_model_mobile.pt` | `ml/models_cassava/best_model/` | `ml/src/export_cassava_artifacts.py:30` | Preserved in original path + organized copy in `PROJECT_DATA/02_MODELS/CASSAVA/` |
| `best_model.pth` | `ml/models_maize/best_model/` | `ml/src/predict_maize.py:44` | Preserved in original path + organized copy in `PROJECT_DATA/02_MODELS/MAIZE/` |
| `best_model_mobile.pt` | `ml/models_maize/best_model/` | `ml/src/export_cashew_artifacts.py:30` | Preserved in original path + organized copy in `PROJECT_DATA/02_MODELS/MAIZE/` |
| `final_model.pth` | `ml/models_maize/final_model/` | `ml/src/train.py:120` | Preserved in original path + organized copy in `PROJECT_DATA/02_MODELS/MAIZE/` |
| `soybean_model.weights.h5` | `ml/models_soybean/` | `ml/src/predict_soybean.py:65` | Preserved in original path + organized copy in `PROJECT_DATA/02_MODELS/SOYBEAN/` |
| `best_model.pth` | `ml/models/best_model/` | `ml/src/predict.py:48` | Preserved in original path + organized copy in `PROJECT_DATA/02_MODELS/TOMATO/` |
| `crop_disease_efficientnetb0.keras` | `ml/models_efficientnet/` | `ml/src/predict_efficientnet.py:38` | Preserved in original path + organized copy in `PROJECT_DATA/02_MODELS/UNIFIED_EFFICIENTNET/` |
| `crop_type_classifier.pth` | `ml/models/crop_classifier/` | `ml/src/train_crop_identifier.py:55` | Preserved in original path + organized copy in `PROJECT_DATA/02_MODELS/CROP_CLASSIFIER/` |
| `ccmt_mobilenet_v3.pth` | `weights/` | `backend/app/ai/ccmt_vision_model.py:28` | Preserved in original path + organized copy in `PROJECT_DATA/02_MODELS/MULTI_CROP_CCMT/` |
| `yolov8n.pt` | `./` | `ml/src/yolo_disease_detector.py:29` | Preserved in original path + organized copy in `PROJECT_DATA/02_MODELS/YOLO/` |

---

## 3. Actively Referenced Sample Images
| Sample Image | Original Location | Referencing Code Location | Status |
| :--- | :--- | :--- | :--- |
| `pear_foliar_blight_yolo.jpg` | `ml/data/yolo_samples/` | `ml/api/app.py:1116` | Preserved + organized in `PROJECT_DATA/04_TESTING/YOLO/` |
| `potato_late_blight_spectral.jpg` | `ml/data/yolo_samples/` | `ml/api/app.py:1121` | Preserved + organized in `PROJECT_DATA/04_TESTING/YOLO/` |
| `multiclass_foliar_lesions.jpg` | `ml/data/yolo_samples/` | `ml/api/app.py:1126` | Preserved + organized in `PROJECT_DATA/04_TESTING/YOLO/` |
| `maize_turcicum_blight.jpg` | `ml/data/yolo_samples/` | `ml/api/app.py:1131` | Preserved + organized in `PROJECT_DATA/04_TESTING/YOLO/` |
| `tomato_foliar_blight.jpg` | `ml/data/yolo_samples/` | `ml/api/app.py:1136` | Preserved + organized in `PROJECT_DATA/04_TESTING/YOLO/` |
