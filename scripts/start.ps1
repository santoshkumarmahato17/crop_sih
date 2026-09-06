# AGRI SHIELD — System Bootstrap Script (PowerShell)
Write-Host "==================================================" -ForegroundColor Green
Write-Host "AGRI SHIELD: Starting Agricultural AI Ecosystem..." -ForegroundColor Green
Write-Host "==================================================" -ForegroundColor Green

$projectRoot = Split-Path -Parent $PSScriptRoot

if (-not (Test-Path "$projectRoot\.env")) {
    Write-Host "Creating .env from .env.example..." -ForegroundColor Yellow
    Copy-Item "$projectRoot\.env.example" "$projectRoot\.env"
}

# Check if Docker is available
$dockerAvailable = (Get-Command docker -ErrorAction SilentlyContinue) -ne $null

if ($dockerAvailable) {
    Write-Host "Launching Docker Compose Services..." -ForegroundColor Cyan
    docker compose up -d --build
} else {
    Write-Host "Docker daemon not detected. Launching resilient native local servers..." -ForegroundColor Cyan

    # 1. Start Backend FastAPI
    Write-Host "Starting Backend FastAPI on http://localhost:8000..." -ForegroundColor Green
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$projectRoot\backend'; python main.py"

    # 2. Start Frontend Vite
    Write-Host "Starting Frontend Vite UI on http://localhost:5173..." -ForegroundColor Green
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$projectRoot\frontend'; npm run dev"
}

Write-Host "`nVerifying Backend API Health..." -ForegroundColor Cyan
Start-Sleep -Seconds 4
try {
    $response = Invoke-RestMethod -Uri "http://localhost:8000/api/v1/health" -Method Get
    Write-Host "Backend Health Probe: $($response.status)" -ForegroundColor Green
    Write-Host "Interactive API Docs: http://localhost:8000/docs" -ForegroundColor Yellow
    Write-Host "AGRI SHIELD Frontend: http://localhost:5173" -ForegroundColor Yellow
} catch {
    Write-Host "Backend is booting in the background. Access http://localhost:8000/docs once initialized." -ForegroundColor Yellow
}
