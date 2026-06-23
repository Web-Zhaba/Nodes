@echo off
TITLE Nodes - System Startup Control
SETLOCAL EnableDelayedExpansion
COLOR 0A

echo ==========================================
echo    NODES: Local-First Action OS Startup
echo ==========================================
echo.

:: 1. Check Directory
if not exist "nodes-frontend" (
    echo [ERROR] nodes-frontend directory not found!
    pause
    exit /b
)

:: 2. Check Frontend environment
echo [*] Checking Local Environment...
if not exist "nodes-frontend\node_modules" (
    echo [WARNING] node_modules not found in nodes-frontend.
    echo [TIP] Installing dependencies first...
    cmd /c "cd nodes-frontend && npm install"
)

:: 3. Launch
echo.
echo Launching Vite Frontend (Neural Interface)...
echo URL: http://localhost:5173
echo.

cd nodes-frontend
npm run dev
