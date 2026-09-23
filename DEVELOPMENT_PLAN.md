# KISAN SATHI — Incremental Development Plan

This document outlines the systematic, multi-phase roadmap for engineering the **KISAN SATHI** AI-Powered Crop Health Monitoring, Disease Early Detection and Spread Intelligence System.

---

## Capabilities to Deliver

The system will incrementally implement the following 23 functional capabilities:

1. Registering farms.
2. Mapping farm boundaries.
3. Dividing farms into zones.
4. Managing crop information.
5. Managing drone monitoring missions.
6. Receiving drone imagery.
7. Processing imagery (orthorectification, tiling, index calculation).
8. Detecting crop-health abnormalities.
9. Detecting possible diseases.
10. Detecting possible pest activity.
11. Detecting water stress.
12. Comparing observations across multiple dates.
13. Detecting whether crop health is improving or deteriorating.
14. Predicting disease and pest risk.
15. Identifying disease hotspots.
16. Analyzing neighboring farms.
17. Estimating potential disease/pest spread risk.
18. Generating crop-health alerts.
19. Providing Integrated Pest Management (IPM) recommendations.
20. Recommending irrigation priorities.
21. Supporting expert/extension-worker validation.
22. Supporting follow-up monitoring.
23. Providing farmer and agricultural-authority dashboards.

---

## Phased Execution Roadmap

### Phase 0: Project Scaffolding & Architecture Foundation *(Current Phase)*
- [x] Inspect workspace and initialize directory hierarchy.
- [x] Formulate `PROJECT_RULES.md`, `ARCHITECTURE.md`, `DEVELOPMENT_PLAN.md`.
- [x] Define multi-container orchestration (`docker-compose.yml` for PostGIS, Redis, MinIO, Backend, Celery, Frontend).
- [x] Establish typed configuration management (`.env.example`, Pydantic Settings).
- [x] Configure backend scaffolding (FastAPI, SQLAlchemy 2.0, GeoAlchemy2, Alembic, Celery).
- [x] Configure frontend scaffolding (React 18, TypeScript, Vite, Tailwind CSS).
- [x] Setup base health check endpoints and static testing infrastructure.
- [x] **Zero premature business functionality**.

---

### Phase 1: Spatial Registry & Crop Topology Engine
- **Target Capabilities**: [1, 2, 3, 4]
- **Deliverables**:
  - Farm Entity Data Models and Migrations (PostGIS Polygons).
  - Monitoring Zone Generation Service (topological/grid-based subdivision).
  - Crop & Phenology Profile Management.
  - Spatial Vector REST Endpoints (GeoJSON CRUD).
  - Frontend Interactive Boundary Drawer & Zone Visualizer (MapLibre GL JS).

---

### Phase 2: Drone Mission Management & Ingestion Pipeline
- **Target Capabilities**: [5, 6, 7]
- **Deliverables**:
  - Drone Monitoring Mission Scheduling & Telemetry Models.
  - S3 / MinIO Presigned Direct Upload Pipeline for High-Resolution Imagery.
  - Asynchronous Imagery Ingestion Worker (Celery).
  - Orthomosaic Processing & Vegetative Index Calculator (NDVI, NDRE, Thermal/CWSI via Rasterio).
  - Zone-Level Zonal Statistics Extraction Engine.

---

### Phase 3: AI/ML Crop Health & Anomaly Detection Engine
- **Target Capabilities**: [8, 9, 10, 11]
- **Deliverables**:
  - Deep Learning Anomaly Detection Model Interface (PyTorch).
  - Multi-class Disease & Pest Vision Inference Engine (OpenCV / PyTorch).
  - Thermal / Water Stress Index Derivation Engine.
  - Anomaly Bounding Box & Polygon Extraction Service.
  - Health Observation Recording & Severity Rating Pipeline.

---

### Phase 4: Multi-Temporal Analytics & Trend Intelligence
- **Target Capabilities**: [12, 13, 14, 15]
- **Deliverables**:
  - Temporal Comparative Matrix (Cross-mission differential raster math).
  - Trajectory Classifier (Deteriorating, Stabilizing, Improving health trends).
  - Statistical Predictive Risk Engine (Weather + Phenology + Historical stress).
  - Spatial Clustering & Hotspot Identification (DBSCAN / Spatial Kernel Density on PostGIS).

---

### Phase 5: Regional Spread Intelligence & Neighbor Analytics
- **Target Capabilities**: [16, 17]
- **Deliverables**:
  - Geospatial Neighbor Proximity Engine (Multi-farm buffer queries in PostGIS).
  - Microclimate & Wind Vector Spread Simulation Engine.
  - Cross-farm Contagion Risk Scoring Algorithm.
  - Regional Heatmap & Outbreak Corridor Visualization.

---

### Phase 6: Advisory, Alerting & Decision Support System
- **Target Capabilities**: [18, 19, 20]
- **Deliverables**:
  - [x] Automated Multi-Channel Crop-Health Alert Dispatcher.
  - [x] Rules-based & AI-assisted Integrated Pest Management (IPM) Advisory Engine.
  - [x] Irrigation Priority Optimization Matrix (Water stress + Soil/Weather inputs).
  - [x] Actionable Treatment Plan Generator for Farmers.
  - [x] Expert Knowledge & Policy Engine (Rule-based constraints)
  - [x] Contextual Advisory Generation (combining AI, Weather, Rules)
  - [x] Follow-Up Recommendation Engine (e.g. "re-scan in 3 days")
  - [x] Multilingual Advisory Engine
    - [x] Marathi
    - [x] Hindi
    - [x] English
    - [x] Marathi-first farmer experience
    - [x] Language preference
    - [x] Evidence-based advisory generation
    - [x] IPM guidance
    - [x] Weather-aware advisory
    - [x] Confidence-aware language
    - [x] Expert referral
    - [x] Multilingual alerts
    - [x] Follow-up instructions

---

### Phase 7: Expert Validation & Follow-up Closed Loop
- **Target Capabilities**: [21, 22]
- **Deliverables**:
  - [x] Agronomist / Extension Worker Verification Queue.
  - [x] Ground-Truth Annotation & Model Calibration Feedback Loop.
  - [x] Laboratory Referral & Confirmed Diagnosis Workflow.
  - [x] Extension Worker / Field Officer Workflow & Dashboard.
  - Automated Targeted Follow-Up Mission Generator (Flight path recommendations based on hotspots).
  - Continuous Monitoring Rescheduling Pipeline.

---

### Phase 8: Comprehensive Farmer & Regional Authority Portals
- **Target Capabilities**: [23]
- **Deliverables**:
  - Polished Farmer Dashboard (Crop health cards, actionable alerts, zone drill-downs).
  - Regional Agricultural Authority Portal (Macro-level spread intelligence, disease outbreak tracking).
  - Report Generation (PDF/GeoJSON exports for agronomic compliance).
  - End-to-End System Testing & Performance Optimization.
