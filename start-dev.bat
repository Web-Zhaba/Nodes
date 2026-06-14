@echo off
TITLE Nodes - Unified System Startup
SETLOCAL EnableDelayedExpansion
COLOR 0D

echo ==========================================
echo    NODES: Full Stack Development Startup
echo ==========================================
echo.

:: 1. Проверка Backend
echo [*] Checking Backend...
if not exist "nodes-backend\venv" (
    echo [ERROR] Backend venv not found. Please run setup first.
)

:: 2. Проверка Frontend
echo [*] Checking Frontend...
if not exist "nodes-frontend\node_modules" (
    echo [WARNING] node_modules not found in nodes-frontend.
)

:: 3. Проверка Landing
echo [*] Checking Landing...
if not exist "nodes-landing\node_modules" (
    echo [WARNING] node_modules not found in nodes-landing.
)

echo.
echo [1/3] Launching Django Backend (Logic Engine)...
echo       URL: http://127.0.0.1:8000/api/v1/
start "Nodes Backend" cmd /k "cd nodes-backend && title Nodes Backend && venv\Scripts\python.exe manage.py runserver 127.0.0.1:8000"

timeout /t 2 /nobreak > nul

echo [2/3] Launching Vite Frontend (Neural Interface)...
echo       URL: http://127.0.0.1:5173
start "Nodes Frontend" cmd /k "cd nodes-frontend && title Nodes Frontend && npm run dev"

timeout /t 1 /nobreak > nul

echo [3/3] Launching Astro Landing Page...
echo       URL: http://localhost:4321
start "Nodes Landing" cmd /k "cd nodes-landing && title Nodes Landing && npm run dev"

echo.
echo ==========================================
echo    All systems initializing...
echo    Check separate windows for logs.
echo ==========================================
echo.
pause
