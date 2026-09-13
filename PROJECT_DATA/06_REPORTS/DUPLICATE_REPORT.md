# DUPLICATE ARTIFACTS & MODELS REPORT

Generated as part of the AGRI SHIELD File & Dataset Organization.

## 1. Exact Duplicate Analysis

| File Path 1 | File Path 2 | Size (Bytes) | SHA-256 Checksum | Match Type | Recommended Action |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `crop_model.pkl` (Root) | `weights/crop_model.pkl` | 3,568,334 | `6b69cf160086eb29be7a25695cf643f87c6999fa4fb0d4ebfd8d438902c34967` | **100% Byte-for-Byte Exact** | Retain both in place to prevent breaking legacy scripts. Archived copy organized in `PROJECT_DATA/02_MODELS/GENERAL/crop_model.pkl`. |

## 2. Versioned / Crop-Specific Model Distinctions

The following models share identical or similar filenames (`best_model.pth`, `best_model_mobile.pt`, `final_model.pth`) across different crop directories. They are **NOT duplicates**; they are distinct neural networks trained on different crop taxonomies:

| Subject | Model File | Size | Architecture | Checksum (MD5) |
| :--- | :--- | :--- | :--- | :--- |
| **Apple** | `ml/models_apple/best_model/best_model.pth` | 6,224,389 B | ResNet / MobileNet | `74bb4d8ad44299b9dddeca893b1b6d19` |
| **Cashew** | `ml/models_cashew/best_model/best_model.pth` | 6,230,277 B | ResNet / MobileNet | `898cbdb917c5270f2cf7c181515efb97` |
| **Cassava** | `ml/models_cassava/best_model/best_model.pth` | 6,230,149 B | ResNet / MobileNet | `41ce2504825d4816c7f9fb5c1c87ef75` |
| **Maize** | `ml/models_maize/best_model/best_model.pth` | 6,236,677 B | ResNet / MobileNet | `1eb933fa1cb2e322fe3ea018ae676ff3` |
| **Tomato** | `ml/models/best_model/best_model.pth` | 6,228,421 B | ResNet / MobileNet | `a27e7f6202ce85698b7dc3fcfaf97155` |
| **Tomato / General** | `ml/models/best_model.pth` | 6,223,109 B | MobileNetV3 | `b1853610996fa1e43486008b8b9319e0` |

> [!IMPORTANT]
> Because these models have different weights specialized for each plant pathology, each is strictly separated in `PROJECT_DATA/02_MODELS/<SUBJECT>/`.
