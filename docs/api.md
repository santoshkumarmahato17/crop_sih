# AGRI SHIELD — API Documentation

## Base URL
- Production: `https://api.agrishield.internal/api/v1`
- Local Development: `http://localhost:8000/api/v1`

## Authentication
JWT Bearer token passed in HTTP `Authorization: Bearer <TOKEN>` header.

## Standard Response Format
```json
{
  "success": true,
  "message": "Operation completed successfully.",
  "data": { ... }
}
```

## Error Envelope (RFC 7807)
```json
{
  "success": false,
  "message": "Validation Error",
  "detail": "Field 'name' is required."
}
```

## Endpoints

### 1. Health Probe
- **Path**: `GET /api/v1/health`
- **Description**: Probes database connectivity, PostGIS extension, Redis, and MinIO readiness.
