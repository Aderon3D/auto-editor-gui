@echo off
echo ===================================================
echo Auto-Editor GUI - Starting Application
echo ===================================================
echo.

echo [1/2] Starting frontend server...
start cmd /k "cd frontend && npm run dev"

echo [2/2] Starting Electron app...
start cmd /k "npm run start"

echo.
echo ===================================================
echo Application started! You can close this window.
echo ===================================================
echo.