@echo off
echo ==============================================
echo   Starting Order Unavu Backend (MySQL Only)
echo ==============================================
cd /d "%~dp0"
call venv\Scripts\activate.bat
python main.py
pause
