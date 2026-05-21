@echo off
TITLE Nodes - System Startup Control
SETLOCAL EnableDelayedExpansion
COLOR 0A

echo ==========================================
echo    NODES: Neural OS Visualizer Startup
echo ==========================================
echo.

:: 1. Проверка каталогов
if not exist "nodes-backend" (
    echo [ERROR] nodes-backend directory not found!
    pause
    exit /b
)
if not exist "nodes-frontend" (
    echo [ERROR] nodes-frontend directory not found!
    pause
    exit /b
)

:: 2. Проверка Backend окружения
echo [*] Checking Backend...
if not exist "nodes-backend\.env" (
    echo [WARNING] nodes-backend\.env not found! 
    echo Creating from example...
    copy "nodes-backend\.env.example" "nodes-backend\.env"
    echo [!] Please fill your API keys in nodes-backend\.env
)

if not exist "nodes-backend\venv" (
    echo [ERROR] Virtual environment not found in nodes-backend\venv
    echo [TIP] Run: cd nodes-backend ^&^& python -m venv venv ^&^& venv\Scripts\pip install -r requirements.txt
    pause
    exit /b
)

:: 3. Проверка Frontend окружения
echo [*] Checking Frontend...
if not exist "nodes-frontend\node_modules" (
    echo [WARNING] node_modules not found in nodes-frontend.
    echo [TIP] Run: cd nodes-frontend ^&^& npm install
    pause
    exit /b
)

:: 4. Запуск
echo.
echo [1/2] Launching Django Backend (Logic Engine)...
echo       URL: http://127.0.0.1:8000/api/v1/
start "Nodes Backend" cmd /k "cd nodes-backend && title Nodes Backend && venv\Scripts\python.exe manage.py runserver 127.0.0.1:8000"

:: Ждем секунду, чтобы бэкенд начал инициализацию
timeout /t 2 /nobreak > nul

echo [2/2] Launching Vite Frontend (Neural Interface)...
echo       URL: http://localhost:5173
start "Nodes Frontend" cmd /k "cd nodes-frontend && title Nodes Frontend && npm run dev"

echo.
echo ==========================================
echo    System initialization complete.
echo    Check the new windows for logs.
echo.
echo    Recommendations:
echo    - Ensure your API keys are in .env
echo    - Use 'ctrl+c' in logs windows to stop
echo ==========================================
echo.
pause
