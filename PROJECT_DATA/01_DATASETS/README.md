# 01_DATASETS Directory

This directory provides standardized, professional subject-wise access to all 7 crop datasets:
- **APPLE**: 9,714 images (train & test splits, 4 classes)
- **CASHEW**: 6,549 images (5 classes: anthracnose, gumosis, healthy, leaf miner, red rust)
- **CASSAVA**: 7,508 images (5 classes: bacterial blight, brown spot, green mite, healthy, mosaic)
- **MAIZE**: 5,358 images (7 classes: fall armyworm, grasshopper, healthy, leaf beetle, leaf blight, leaf spot, streak virus)
- **ONION**: 13,229 images (onion datasets)
- **ORANGE**: 27,686 images (3 classes: Citrus_Canker, Citrus_Nutrient_Deficiency, Healthy)
- **TOMATO**: 5,805 images (5 classes: healthy, leaf blight, leaf curl, septoria leaf spot, verticillium wilt)

**Total Images**: 75,849 images across 7 crops.

> [!NOTE]
> All dataset directories are mounted via native NTFS Junctions to their canonical storage paths.
> This guarantees zero duplicate disk space while ensuring 100% continuous runtime compatibility with active backend, ML inference, and training pipelines.
