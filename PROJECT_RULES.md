# KISAN SATHI — Project Rules and Engineering Standards

## 1. System Identity and Scope
- **Official Designation**: KISAN SATHI (AI-Powered Crop Health Monitoring, Disease Early Detection and Spread Intelligence System).
- **Terminology Standard**: This software project is strictly designated as a **System** or **Application**. Never refer to this project as an "app".
- **Incremental Construction**: Functionality is implemented strictly in planned, modular phases. Premature monolithic code, mock business data, or half-baked feature suites are strictly prohibited.

---

## 2. Architectural Principles

### 2.1 Clean & Modular Architecture
- System layers must be cleanly separated with strict unidirectional dependency flow:
  - **Presentation Layer** (Frontend React SPA / MapLibre GL)
  - **API & Interface Layer** (FastAPI routers, dependency injectors, request/response validation)
  - **Application / Service Layer** (Business orchestration, transaction control, domain logic)
  - **Domain / Model Layer** (SQLAlchemy models, GeoAlchemy2 geometries, domain entities)
  - **Data Access & Storage Layer** (PostgreSQL / PostGIS, MinIO S3 Object Storage)
  - **Asynchronous Execution Layer** (Celery workers, Redis queues, ML inference engines)
  - **Analytical & Geospatial Processing Layer** (Rasterio, GeoPandas, PyTorch, OpenCV)
- No cross-layer contamination (e.g., API controllers must never directly execute raw database queries or invoke raw PyTorch tensors without service/engine boundaries).

### 2.2 API-First Design & Strict Typing
- All REST endpoints must be defined with explicit Pydantic v2 schemas for both request inputs and responses.
- Use explicit HTTP status codes, standard JSON envelopes, and RFC 7807 compliant error responses.
- Backend Python codebase must maintain strict PEP 484 type annotations and pass `mypy` type checks.
- Frontend TypeScript codebase must enable `strict: true` with zero usage of `any`.

### 2.3 Secure by Default
- **Zero Hardcoded Credentials**: API keys, database credentials, MinIO secrets, and secret keys must be loaded strictly from environment variables via typed configuration classes.
- **SQL Injection Prevention**: All database interactions must use parameterized ORM queries via SQLAlchemy 2.0.
- **Spatial Data Sanitization**: All geometry inputs (GeoJSON, WKT) must be validated against spatial reference schemas (EPSG:4326 / EPSG:3857) and sanitized using Shapely before insertion into PostGIS.
- **Access Control**: Role-based access control (Farmer, Agronomist, Agricultural Authority, Admin) must be enforced at the API route dependency layer.

---

## 3. Technology Stack & Component Responsibilities

| Subsystem | Technology | Responsibility |
| :--- | :--- | :--- |
| **Frontend** | React 18, TypeScript, Vite, Tailwind CSS | Farmer & Authority dashboards, MapLibre GL GIS spatial views, alert center. |
| **Backend** | Python 3.11+, FastAPI, Pydantic v2, SQLAlchemy 2.0 | High-performance async REST API, spatial query interfaces, business coordination. |
| **Database** | PostgreSQL 16 + PostGIS 3.4 | Relational entity storage, spatial indexing (`GIST`), vector boundary math, temporal queries. |
| **Object Store** | MinIO (S3-compatible) | High-resolution drone orthomosaics, raw multispectral/thermal GeoTIFF bands, processed index rasters. |
| **Queue & Cache** | Celery + Redis 7 | Heavy raster ingestion, orthomosaic tiling, ML inference scheduling, background spread simulation. |
| **AI / ML** | PyTorch, OpenCV, scikit-learn, NumPy, Pandas | Canopy anomaly detection, disease classification, pest damage segmentation, predictive spread modeling. |
| **Geospatial** | GeoPandas, Shapely, Rasterio, GDAL | Crop zone subdivision, raster band calculation (NDVI, NDRE, CWSI), spatial overlays. |

---

## 4. Coding Standards & Conventions

### 4.1 Python Backend
- **Code Style**: Black formatter (88-char limit), Ruff linter, isort import sorting.
- **Async First**: Use asynchronous database sessions (`AsyncSession`) and async route handlers for standard I/O bound endpoints.
- **Service Pattern**: Business operations must reside inside dedicated service classes under `app/services/` inheriting from abstract base classes.
- **Database Migrations**: Every database schema change must be captured in an explicit Alembic migration script under `alembic/versions/`.

### 4.2 Frontend Web Interface
- **Component Design**: Modular functional components with TypeScript props interfaces. Avoid massive monolithic components (> 250 lines).
- **Design Aesthetic**: Premium Agricultural Intelligence aesthetic using tailored color palettes (leaf emeralds, satellite blues, warning ambers, sensor slate, dark mode defaults), smooth transitions, modern typography, and responsive layouts.
- **State Management**: Predictable state isolation using typed React hooks and modular stores.
- **Map & Spatial Views**: MapLibre GL JS integration using reusable canvas components with vector tile / GeoJSON source isolation.

### 4.3 Geospatial & Raster Operations
- Standardize all vector storage in **WGS 84 (EPSG:4326)**; project to appropriate UTM / equal-area projections (e.g., **EPSG:3857** or local UTM zone) when computing metric distances and zone surface areas.
- Raster processing must stream windows via `Rasterio` to avoid loading massive gigabyte-scale drone TIFFs directly into memory at once.

---

## 5. Branching, Verification & Quality Assurance
- **Unit Testing**: All services, geometric calculators, and utility functions must have dedicated unit tests (`pytest` for backend, `vitest` for frontend).
- **Integration Testing**: API endpoints must have automated integration tests against a real or containerized PostGIS instance.
- **Incremental Validation**: Every implementation step must be verified with automated or structural tests before marking the step complete.
