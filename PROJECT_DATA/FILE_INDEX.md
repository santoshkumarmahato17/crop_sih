# AGRI SHIELD — MASTER FILE INDEX

A comprehensive, searchable directory index of all datasets, models, training splits, test files, and reports organized by **Subject**, **Category**, **File Name**, and **Location**.

| Subject | Category | Artifact / File | Location in PROJECT_DATA | Original Source Location | Application Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Apple** | Dataset | 9,714 Images (train/test) | `01_DATASETS/APPLE/` | `apple dataset/` | **Active** (ml/api/app.py) |
| **Apple** | Model | `best_model.pth` | `02_MODELS/APPLE/best_model.pth` | `ml/models_apple/best_model/` | **Active** (predict_apple.py) |
| **Apple** | Model | `apple_leaf_mobilenet_v3.pt` | `02_MODELS/APPLE/apple_leaf_mobilenet_v3.pt` | `ml/models_apple/mobile_model/` | **Active** (train_apple.py) |
| **Apple** | Model Metadata | `class_names.json` | `02_MODELS/APPLE/class_names.json` | `ml/models_apple/` | Active |
| **Apple** | Training Splits | `train_samples.json` | `03_TRAINING/APPLE/train_samples.json` | `ml/data/splits_apple/` | Training Archive |
| **Apple** | Training Splits | `val_samples.json` | `03_TRAINING/APPLE/val_samples.json` | `ml/data/splits_apple/` | Training Archive |
| **Apple** | Training Splits | `test_samples.json` | `03_TRAINING/APPLE/test_samples.json` | `ml/data/splits_apple/` | Training Archive |
| **Apple** | Training Script | `train_apple.py` | `03_TRAINING/APPLE/train_apple.py` | `ml/src/train_apple.py` | Active Script |
| **Apple** | Results | `apple_confusion_matrix.png` | `05_RESULTS/CONFUSION_MATRICES/` | `ml/reports_apple/` | Evaluation Metric |
| **Apple** | Results | `apple_per_class_metrics.png`| `05_RESULTS/METRICS/` | `ml/reports_apple/` | Evaluation Metric |
| **Apple** | Results | `apple_training_history.png` | `05_RESULTS/TRAINING_HISTORIES/` | `ml/reports_apple/` | Evaluation Metric |
| **Apple** | Report | `apple_dataset_report.json` | `06_REPORTS/DATASET_REPORTS/` | `ml/reports_apple/` | Audit Report |
| **Cashew** | Dataset | 6,549 Images (5 classes) | `01_DATASETS/CASHEW/` | `Cashew/` | **Active** (ml/api/app.py) |
| **Cashew** | Model | `best_model.pth` | `02_MODELS/CASHEW/best_model.pth` | `ml/models_cashew/best_model/` | **Active** (predict_cashew.py) |
| **Cashew** | Model | `best_model_mobile.pt` | `02_MODELS/CASHEW/best_model_mobile.pt` | `ml/models_cashew/best_model/` | **Active** (export_cashew.py) |
| **Cashew** | Training Splits | `train.json` | `03_TRAINING/CASHEW/train.json` | `ml/data/splits_cashew/` | Training Archive |
| **Cashew** | Results | `cashew_confusion_matrix.png`| `05_RESULTS/CONFUSION_MATRICES/` | `ml/reports_cashew/` | Evaluation Metric |
| **Cashew** | Results | `cashew_per_class_metrics.png`| `05_RESULTS/METRICS/` | `ml/reports_cashew/` | Evaluation Metric |
| **Cassava** | Dataset | 7,508 Images (5 classes) | `01_DATASETS/CASSAVA/` | `Cassava/` | **Active** (ml/api/app.py) |
| **Cassava** | Model | `best_model.pth` | `02_MODELS/CASSAVA/best_model.pth` | `ml/models_cassava/best_model/` | **Active** (predict_cassava.py) |
| **Cassava** | Model | `best_model_mobile.pt` | `02_MODELS/CASSAVA/best_model_mobile.pt` | `ml/models_cassava/best_model/` | **Active** (export_cassava.py) |
| **Cassava** | Training Splits | `train.json` | `03_TRAINING/CASSAVA/train.json` | `ml/data/splits_cassava/` | Training Archive |
| **Cassava** | Results | `cassava_confusion_matrix.png`| `05_RESULTS/CONFUSION_MATRICES/` | `ml/reports_cassava/` | Evaluation Metric |
| **Maize** | Dataset | 5,358 Images (7 classes) | `01_DATASETS/MAIZE/` | `Maize/` | **Active** (ml/api/app.py) |
| **Maize** | Model | `best_model.pth` | `02_MODELS/MAIZE/best_model.pth` | `ml/models_maize/best_model/` | **Active** (predict_maize.py) |
| **Maize** | Model | `best_model_mobile.pt` | `02_MODELS/MAIZE/best_model_mobile.pt` | `ml/models_maize/best_model/` | **Active** |
| **Maize** | Model | `final_model.pth` | `02_MODELS/MAIZE/final_model.pth` | `ml/models_maize/final_model/` | **Active** |
| **Maize** | Training Splits | `train.json` | `03_TRAINING/MAIZE/train.json` | `ml/data/splits_maize/` | Training Archive |
| **Maize** | Results | `maize_confusion_matrix.png` | `05_RESULTS/CONFUSION_MATRICES/` | `ml/reports_maize/` | Evaluation Metric |
| **Onion** | Dataset | 13,229 Images | `01_DATASETS/ONION/` | `onion d-set/` | Offline Dataset |
| **Orange** | Dataset | 27,686 Images (3 classes) | `01_DATASETS/ORANGE/` | `orange d-set/` | **Active** (predict_orange) |
| **Orange** | Model | `best_model.pth` | `02_MODELS/ORANGE/best_model.pth` | `ml/models/best_model.pth` | **Active** (predictor.py) |
| **Soybean** | Model | `soybean_model.weights.h5` | `02_MODELS/SOYBEAN/` | `ml/models_soybean/` | **Active** (predict_soybean.py)|
| **Tomato** | Dataset | 5,805 Images (5 classes) | `01_DATASETS/TOMATO/` | `Tomato/` | **Active** (ml/api/app.py) |
| **Tomato** | Model | `best_model.pth` | `02_MODELS/TOMATO/best_model.pth` | `ml/models/best_model/` | **Active** (predict.py) |
| **Tomato** | Model | `best_model_mobile.pt` | `02_MODELS/TOMATO/best_model_mobile.pt` | `ml/models/best_model/` | **Active** |
| **Tomato** | Model | `final_model.pth` | `02_MODELS/TOMATO/final_model.pth` | `ml/models/final_model/` | **Active** |
| **Tomato** | Training Splits | `train.json` | `03_TRAINING/TOMATO/train.json` | `ml/data/splits/` | Training Archive |
| **Tomato** | Results | `tomato_confusion_matrix.png`| `05_RESULTS/CONFUSION_MATRICES/` | `ml/reports/` | Evaluation Metric |
| **Unified** | Model | `crop_disease_efficientnetb0.keras` | `02_MODELS/UNIFIED_EFFICIENTNET/` | `ml/models_efficientnet/` | **Active** (predict_efficientnet.py) |
| **Crop Classifier** | Model | `crop_type_classifier.pth` | `02_MODELS/CROP_CLASSIFIER/` | `ml/models/crop_classifier/` | **Active** (train_crop_identifier.py) |
| **Multi-Crop** | Model | `ccmt_mobilenet_v3.pth` | `02_MODELS/MULTI_CROP_CCMT/` | `weights/` | **Active** (ccmt_vision_model.py) |
| **YOLO** | Model | `yolov8n.pt` | `02_MODELS/YOLO/yolov8n.pt` | `./yolov8n.pt` | **Active** (yolo_disease_detector.py) |
| **YOLO** | Model | `yolov8n-seg.pt` | `02_MODELS/YOLO/yolov8n-seg.pt` | `./yolov8n-seg.pt` | Standalone Weights |
| **YOLO** | Test Images | 5 Sample Leaf Images | `04_TESTING/YOLO/` | `ml/data/yolo_samples/` | **Active** (sample-images API) |
| **General** | Model | `crop_model.pkl` | `02_MODELS/GENERAL/crop_model.pkl` | `weights/crop_model.pkl` | Machine Learning Model |
| **General** | Test Images | `sample_leaf.jpg` | `04_TESTING/SAMPLES/sample_leaf.jpg` | `./sample_leaf.jpg` | Standalone Sample |
| **General** | Test Images | `test_chewed_leaf.jpg` | `04_TESTING/SAMPLES/test_chewed_leaf.jpg`| `./test_chewed_leaf.jpg` | Standalone Sample |
