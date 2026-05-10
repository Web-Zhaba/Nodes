@echo off
TITLE Nodes - System Startup
COLOR 0A

echo ==========================================
echo    NODES: Neural OS Visualizer Startup
echo ==========================================
echo.

:: Check if backend directory exists
if not exist "nodes-backend" (
    echo [ERROR] nodes-backend directory not found!
    pause
    exit /b
)

:: Check if frontend directory exists
if not exist "nodes-frontend" (
    echo [ERROR] nodes-frontend directory not found!
    pause
    exit /b
)

echo [1/2] Launching Django Backend (Logic Engine)...
start "Nodes Backend" cmd /k "cd nodes-backend && venv\Scripts\python.exe manage.py runserver"

echo [2/2] Launching Vite Frontend (Neural Interface)...
start "Nodes Frontend" cmd /k "cd nodes-frontend && npm run dev"

echo.
echo ==========================================
echo    System initialization complete.
echo    Check the new windows for logs.
echo ==========================================
echo.
pause
