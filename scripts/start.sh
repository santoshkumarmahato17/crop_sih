#!/usr/bin/env bash
# AGRI SHIELD — System Bootstrap Script (Bash)
set -e

echo "=================================================="
echo "AGRI SHIELD: Starting Multi-Container Ecosystem..."
echo "=================================================="

if [ ! -f ".env" ]; then
    echo "Creating .env from .env.example..."
    cp .env.example .env
fi

echo "Launching Docker Compose Services..."
docker compose up -d --build

echo "Verifying Backend API Health..."
sleep 5

if command -v curl >/dev/null 2>&1; then
    curl -s http://localhost:8000/api/v1/health | grep "AGRI SHIELD" && echo "AGRI SHIELD Backend is operational!"
fi

echo "AGRI SHIELD is accessible at http://localhost:5173"
