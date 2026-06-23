@echo off
TITLE Nodes - Unified System Startup
SETLOCAL EnableDelayedExpansion
COLOR 0D

echo ==========================================
echo    NODES: Local-First Dev Startup
echo ==========================================
echo.

:: 1. Проверка Frontend
echo [*] Checking Frontend...
if not exist "nodes-frontend\node_modules" (
    echo [WARNING] node_modules not found in nodes-frontend.
    echo [TIP] Installing dependencies first...
    cmd /c "cd nodes-frontend && npm install"
)

:: 2. Проверка Landing
echo [*] Checking Landing...
if not exist "nodes-landing\node_modules" (
    echo [WARNING] node_modules not found in nodes-landing.
    echo [TIP] Installing dependencies first...
    cmd /c "cd nodes-landing && npm install"
)

echo.
echo [1/2] Launching Vite Frontend (Neural Interface)...
echo       URL: http://localhost:5173
start "Nodes Frontend" cmd /k "cd nodes-frontend && title Nodes Frontend && npm run dev"

timeout /t 1 /nobreak > nul

echo [2/2] Launching Astro Landing Page...
echo       URL: http://localhost:4321
start "Nodes Landing" cmd /k "cd nodes-landing && title Nodes Landing && npm run dev"

echo.
echo ==========================================
echo    All systems initializing...
echo    Check separate windows for logs.
echo ==========================================
echo.
pause
