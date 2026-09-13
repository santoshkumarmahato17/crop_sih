# AGRI SHIELD — Local Development Launcher
Write-Host "==========================================================" -ForegroundColor Green
Write-Host " Starting AGRI SHIELD Local Development Servers" -ForegroundColor Green
Write-Host "==========================================================" -ForegroundColor Green

# 1. Start Backend in background process or separate window
Write-Host "Starting Backend FastAPI on http://localhost:8001..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot\backend'; python main.py"

# 2. Start Frontend Vite in separate window
Write-Host "Starting Frontend Vite UI on http://localhost:5173..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot\frontend'; npm run dev"

Write-Host "`nSystem Launch Initiated!" -ForegroundColor Green
Write-Host "Access Frontend at: http://localhost:5173" -ForegroundColor Yellow
Write-Host "Access Swagger API at: http://localhost:8001/docs" -ForegroundColor Yellow
