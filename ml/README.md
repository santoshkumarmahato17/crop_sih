# Tomato Leaf Disease Classification Pipeline (Production ML)

Deep learning computer vision pipeline for classifying tomato leaf diseases across 5 pathological conditions.

## Classes Supported
1. **Healthy**
2. **Leaf Blight** (*Phytophthora infestans / Alternaria solani*)
3. **Leaf Curl** (*Tomato Yellow Leaf Curl Virus - TYLCV*)
4. **Septoria Leaf Spot** (*Septoria lycopersici*)
5. **Verticillium Wilt** (*Verticillium dahliae*)

---

## Directory Layout
```text
ml/
├── config.yaml               # System parameters, thresholds, and hyperparameters
├── requirements.txt          # Python dependencies
├── README.md                 # System documentation & usage guide
├── data/
│   └── splits/               # Stratified, deduplicated train/val/test splits (zero leakage)
├── models/
│   ├── best_model/
│   │   ├── best_model.pth    # PyTorch production weights checkpoint
│   │   └── best_model_mobile.pt # TorchScript optimized mobile deployment model
│   ├── final_model/
│   ├── class_names.json      # Ordered 5-class names list
│   └── model_metadata.json   # Model architecture & evaluation metadata
├── src/
│   ├── dataset.py            # Integrity verification, corruption filter, deduplication
│   ├── preprocessing.py      # Quality checks (blur, illumination) & tensor conversions
│   ├── augmentation.py       # Realistic phone camera leaf augmentations
│   ├── model.py              # MobileNetV3 transfer learning model definition
│   ├── train.py              # Two-stage warmup & fine-tuning training loop
│   ├── evaluate.py           # Independent test set evaluation & metric reporting
│   ├── predict.py            # Inference engine with confidence thresholding & IPM advisory
│   ├── test_inference.py     # Automated sample test verification
│   └── utils.py              # Visualizations, metrics, and seed management
├── api/
│   └── app.py                # Standalone FastAPI inference service
└── reports/
    ├── dataset_report.json   # Detailed dataset census and corruption logs
    ├── classification_report.json # Accuracy, precision, recall, F1 per class
    ├── confusion_matrix.png  # High-res confusion matrix heatmap
    ├── per_class_metrics.png # Per-class metric bar charts
    └── training_history.png  # Loss and accuracy curves
```

---

## Quickstart Commands

### 1. Inspect Dataset & Generate Stratified Splits
```bash
python -m ml.src.dataset
```

### 2. Train Model
```bash
python -m ml.src.train
```

### 3. Evaluate on Held-Out Test Set
```bash
python -m ml.src.evaluate
```

### 4. Run Automated Inference Verification
```bash
python -m ml.src.test_inference
```

### 5. Launch Inference REST API
```bash
uvicorn ml.api.app:app --host 0.0.0.0 --port 8001
```

---

## REST API Specification

### Endpoint: `POST /api/predict`
- **Content-Type**: `multipart/form-data`
- **Body**: `image=@<path_to_leaf_image>`
- **Response**:
```json
{
  "success": true,
  "prediction": "Septoria Leaf Spot",
  "confidence": 94.6,
  "reliable": true,
  "status": "High Confidence",
  "probabilities": {
    "Healthy": 0.010,
    "Leaf Blight": 0.020,
    "Leaf Curl": 0.010,
    "Septoria Leaf Spot": 0.946,
    "Verticillium Wilt": 0.014
  },
  "explanation": "Identified symptoms consistent with Septoria Leaf Spot (Septoria lycopersici)...",
  "quality_assessment": {
    "is_acceptable": true,
    "quality_status": "OK",
    "blur_score": 142.5,
    "is_blurry": false,
    "brightness": 128.4
  }
}
```

### Endpoint: `GET /api/health`
- **Response**:
```json
{
  "status": "healthy",
  "service": "Tomato Leaf Disease Classifier",
  "version": "1.0.0",
  "model_loaded": true,
  "classes": ["Healthy", "Leaf Blight", "Leaf Curl", "Septoria Leaf Spot", "Verticillium Wilt"]
}
```
