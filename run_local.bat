@echo off
echo ==========================================================
echo  Starting AGRI SHIELD Local Development Servers
echo ==========================================================

start "AGRI SHIELD - Backend" cmd /k "cd /d %~dp0backend && python main.py"
start "AGRI SHIELD - Frontend" cmd /k "cd /d %~dp0frontend && npm run dev"

echo.
echo Launching services...
echo Frontend: http://localhost:5173
echo Backend:  http://localhost:8000
echo API Docs: http://localhost:8000/docs
echo ==========================================================
pause
