# AGRI SHIELD — System Bootstrap Script (PowerShell)
Write-Host "==================================================" -ForegroundColor Green
Write-Host "AGRI SHIELD: Starting Multi-Container Ecosystem..." -ForegroundColor Green
Write-Host "==================================================" -ForegroundColor Green

if (-not (Test-Path ".env")) {
    Write-Host "Creating .env from .env.example..." -ForegroundColor Yellow
    Copy-Item ".env.example" ".env"
}

Write-Host "Launching Docker Compose Services..." -ForegroundColor Cyan
docker compose up -d --build

Write-Host "Verifying Backend API Health..." -ForegroundColor Cyan
Start-Sleep -Seconds 5
try {
    $response = Invoke-RestMethod -Uri "http://localhost:8000/api/v1/health" -Method Get
    Write-Host "Health Probe Response: $($response.status)" -ForegroundColor Green
    Write-Host "AGRI SHIELD is online at http://localhost:5173" -ForegroundColor Green
} catch {
    Write-Host "Services are starting up in the background. Check 'docker compose logs -f'." -ForegroundColor Yellow
}
