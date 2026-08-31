# AGRI SHIELD — Developer Guide

## Prerequisites
- Python 3.11+
- Node.js 20+
- Docker & Docker Compose
- PostgreSQL 16 with PostGIS 3.4 (or via Docker)

## Getting Started

### 1. Environment Configuration
```bash
cp .env.example .env
```

### 2. Run with Docker Compose
```bash
docker compose up -d --build
```

### 3. Running Backend Locally
```bash
cd backend
python -m venv venv
# Windows:
.\venv\Scripts\Activate.ps1
# Linux/macOS:
source venv/bin/activate

pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

### 4. Running Frontend Locally
```bash
cd frontend
npm install
npm run dev
```
