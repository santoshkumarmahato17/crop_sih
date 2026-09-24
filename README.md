# KISAN SATHI

[![StackShare](https://img.shields.io/badge/tech-stack-0690fa.svg?style=flat)](https://stackshare.io/kr.santoshmahato/kisansathi)

**AI-Powered Crop Health Monitoring, Disease Early Detection and Spread Intelligence System** 

KISAN SATHI is an enterprise-grade agricultural intelligence platform engineered to continuously monitor farm lands, detect crop stress and pathology early, simulate disease/pest contagion across neighboring boundaries, and provide verified Integrated Pest Management (IPM) guidance.

---

## System Capabilities Matrix

The system incrementally delivers 23 core capabilities across 8 execution phases:
1. **Farm Registration** (boundary mapping & spatial metadata)
2. **Zone Division** (topological & grid stratification)
3. **Crop Information Management** (phenology, planting dates, varietals)
4. **Drone Monitoring Missions** (flight paths, multi-date schedules)
5. **Multi-Modal Imagery Ingestion** (RGB, Multispectral, Thermal GeoTIFFs)
6. **Raster & Index Processing** (NDVI, NDRE, CWSI, thermal anomalies)
7. **AI Anomaly & Disease Detection** (Vision transformers, PyTorch classifiers)
8. **Multi-Temporal Comparative Analysis** (trend tracking across observation dates)
9. **Regional Spread Intelligence** (wind vector & buffer modeling across neighboring farms)
10. **Automated Alerting & IPM Recommendations** (irrigation priorities & treatment plans)
11. **Agronomist Validation Loop** (ground-truth verification & flight replanning)
12. **Farmer & Agricultural Authority Portals** (interactive GIS & spatial dashboards)

---

## Repository Structure

```
crop/
├── .env.example              # Environment variables template
├── .gitignore                # Git ignore rules
├── ARCHITECTURE.md           # System architecture & component design
├── DEVELOPMENT_PLAN.md       # Incremental capability roadmap (23 steps)
├── docker-compose.yml        # Multi-container orchestration (PostGIS, Redis, MinIO, Backend, Celery, Frontend)
├── PROJECT_RULES.md          # Architectural rules & coding standards
├── README.md                 # System overview & quickstart
├── backend/                  # Python 3.11+ / FastAPI / PostGIS / Celery Backend
│   ├── alembic/              # Database migration definitions
│   ├── app/
│   │   ├── api/              # Versioned API routes & dependency injection
│   │   ├── core/             # Typed settings, security, logging
│   │   ├── db/               # Database engine, session, base classes
│   │   ├── ml/               # Machine learning interfaces & model registry
│   │   ├── models/           # SQLAlchemy & GeoAlchemy2 domain models
│   │   ├── schemas/          # Pydantic v2 I/O schemas
│   │   ├── services/         # Business logic & service layer contracts
│   │   ├── spatial/          # Geospatial coordinate & raster utilities
│   │   ├── workers/          # Celery asynchronous task definitions
│   │   └── main.py           # Application entrypoint & health probe
│   ├── tests/                # Automated unit & integration test suite
│   ├── Dockerfile            # Container build with GDAL/PROJ dependencies
│   ├── pyproject.toml        # Build system & dependency specifications
│   └── requirements.txt      # Pinned Python package dependencies
└── frontend/                 # React 18 / TypeScript / Vite / Tailwind CSS Frontend
    ├── src/
    │   ├── components/       # Reusable UI component library
    │   ├── features/         # Feature modules (farms, zones, imagery, map, etc.)
    │   ├── hooks/            # Custom React hooks
    │   ├── services/         # API HTTP client & service endpoints
    │   ├── store/            # Client-side state stores
    │   ├── styles/           # Global design system & Tailwind CSS
    │   ├── types/            # TypeScript domain & API interfaces
    │   ├── App.tsx           # Main application shell
    │   └── main.tsx          # Frontend mount entrypoint
    ├── Dockerfile            # Development & production container build
    ├── package.json          # Node dependencies & scripts
    ├── tsconfig.json         # Strict TypeScript compiler configuration
    └── vite.config.ts        # Vite build tool configuration
```

---

## Technology Stack

- **Frontend**: React 18, TypeScript 5, Vite, Tailwind CSS, MapLibre GL JS, Lucide Icons.
- **Backend API**: Python 3.11+, FastAPI, Pydantic v2, SQLAlchemy 2.0 (Async), GeoAlchemy2, Alembic.
- **Database**: PostgreSQL 16 with PostGIS 3.4 Spatial Extension.
- **Object Storage**: MinIO (S3-compatible API for raster GeoTIFFs and orthomosaics).
- **Asynchronous Tasks**: Celery with Redis 7 message broker.
- **AI & Geospatial Processing**: PyTorch, OpenCV, GeoPandas, Shapely, Rasterio, scikit-learn.

---

## Infrastructure Initialization

### 1. Environment Setup
```bash
cp .env.example .env
```

### 2. Multi-Container Orchestration
```bash
docker compose up -d --build
```

### 3. Verify Health
- Backend Health Probe: `http://localhost:8000/api/v1/health`
- Interactive API Documentation: `http://localhost:8000/docs`
- Frontend Portal: `http://localhost:5173`
- MinIO Storage Console: `http://localhost:9001`
- detail
