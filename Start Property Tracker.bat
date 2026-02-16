@echo off
echo Starting Polish Property Tracker...
echo.
echo App will be available at http://localhost:3060
echo.
start http://localhost:3060
cd /d "%~dp0"
call npm run dev
pause
