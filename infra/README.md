# AGRI SHIELD — Infrastructure & Container Automation

Contains container definitions, deployment manifests, database initialization scripts, and cloud infrastructure templates.

## Directory Structure
- `docker/`: Custom Dockerfiles and container initialization entrypoints.
- `docker/postgres/`: PostGIS initialization SQL scripts.
- `docker/minio/`: Storage bucket provisioning scripts.
- `docker-compose.infra.yml`: Standalone compose file for spinning up core infrastructure dependencies (PostGIS, Redis, MinIO) locally.
