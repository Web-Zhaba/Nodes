@echo off
TITLE Nodes - Landing Page Startup
SETLOCAL EnableDelayedExpansion
COLOR 0B

echo ==========================================
echo    NODES: Landing Page Startup
echo ==========================================
echo.

:: 1. Проверка каталогов
if not exist "nodes-landing" (
    echo [ERROR] nodes-landing directory not found!
    pause
    exit /b
)

:: 2. Проверка окружения
echo [*] Checking Environment...
if not exist "nodes-landing\node_modules" (
    echo [WARNING] node_modules not found in nodes-landing.
    set /p install="Install dependencies now? (y/n): "
    if /i "!install!"=="y" (
        echo [*] Installing dependencies...
        cd nodes-landing && npm install
        cd ..
    ) else (
        echo [!] Please run 'npm install' in nodes-landing directory.
        pause
        exit /b
    )
)

:: 3. Запуск
echo.
echo [*] Launching Astro Landing Page...
echo     URL: http://127.0.0.1:4321
start "Nodes Landing" cmd /k "cd nodes-landing && title Nodes Landing && npm run dev"

echo.
echo ==========================================
echo    Landing page initialization complete.
echo    Check the new window for logs.
echo ==========================================
echo.
pause
