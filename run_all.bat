@echo off
echo ========================================================
echo   ORDER UNAVU - Starting Backend and Frontend Servers
echo ========================================================

start "OrderUnavu Backend (FastAPI + MySQL)" cmd /k "cd /d "%~dp0backend" && call venv\Scripts\activate.bat && python main.py"
start "OrderUnavu Frontend (React + Vite)" cmd /k "cd /d "%~dp0frontend" && npm run dev"

echo Both servers launched in separate windows!
echo Backend:  http://127.0.0.1:8000
echo Frontend: http://localhost:5173
echo ========================================================
pause

