# Soybean Crop Disease Classification Model

Production-grade 10-class foliar pathology classifier for soybean foliage.

## 1. Model Overview
- **Architecture**: MobileNetV2 (1.00 / 224) transfer learning sequential classifier
- **Framework**: TensorFlow / Keras
- **Input Size**: 224 × 224 × 3 (RGB)
- **Baked Preprocessing**: `Rescaling(scale=0.00784313725490196, offset=-1.0)`
  - *Contract*: Pass raw [0, 255] RGB pixel values. The model internally normalizes to `[-1.0, 1.0]`.
- **Output**: 10-class softmax probability distribution
- **Primary Weights File**: `soybean_model.weights.h5` (9.61 MB)
- **Bundled Model File**: `soybean_model.keras` (9.67 MB)

---

## 2. Supported Class Taxonomy (10 Classes in Exact Training Order)
1. `Bacterial_Pustule` (*Xanthomonas axonopodis pv. glycines*)
2. `Frogeye_Leaf_Spot` (*Cercospora sojina*)
3. `Healthy` (*Glycine max* - Healthy Foliage)
4. `Iron_Deficiency_Chlorosis` (Abiotic physiological disorder)
5. `Potassium_Deficiency` (Abiotic nutrient deficiency)
6. `Powdery_Mildew` (*Microsphaera diffusa*)
7. `Rhizoctonia_Aerial_Blight` (*Rhizoctonia solani*)
8. `Rust` (*Phakopsora pachyrhizi*)
9. `Sudden_Death_Syndrome` (*Fusarium virguliforme*)
10. `Target_Spot` (*Corynespora cassiicola*)

---

## 3. Confidence & Safety Policy
- **High Confidence** (`>= 0.70` default): Primary diagnosis returned with verified agronomic advisory.
- **Medium Confidence** (`0.45` to `0.70` default): Diagnosis returned with review recommendation.
- **Low Confidence** (`< 0.45` default): Returns `Uncertain` — never forces a disease classification on insufficient visual evidence.
- Configurable via environment variables: `SOYBEAN_HIGH_CONF` and `SOYBEAN_MEDIUM_CONF`.
