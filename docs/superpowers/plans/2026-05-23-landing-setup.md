# Landing Page Setup & Deployment Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Set up a local development script for the landing page and configure its deployment to Vercel on a subdomain.

**Architecture:** Create a batch script for local development and leverage Vercel's GitHub integration for automatic deployments of the `nodes-landing` subdirectory.

**Tech Stack:** Astro, Batch, Vercel, DNS (Reg.ru).

---

### Task 1: Create `run-landing.bat`

**Files:**
- Create: `run-landing.bat`

- [ ] **Step 1: Create the batch script**

Write the following content to `run-landing.bat` in the project root:

```batch
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
echo     URL: http://localhost:4321
start "Nodes Landing" cmd /k "cd nodes-landing && title Nodes Landing && npm run dev"

echo.
echo ==========================================
echo    Landing page initialization complete.
echo    Check the new window for logs.
echo ==========================================
echo.
pause
```

- [ ] **Step 2: Commit the script**

```bash
git add run-landing.bat
git commit -m "feat: add run-landing.bat for local development"
```

---

### Task 2: Verify Local Execution

- [ ] **Step 1: Run the script**

Execute `run-landing.bat` and ensure the Astro server starts without errors.

- [ ] **Step 2: Access the landing page**

Open `http://localhost:4321` in the browser and verify the landing page renders correctly.

---

### Task 3: Vercel Project Configuration (Instructions)

- [ ] **Step 1: Create a new project in Vercel**
  - Go to the Vercel Dashboard.
  - Import the repository.
  - **IMPORTANT:** In the "Root Directory" setting, select `nodes-landing`.
  - Framework Preset should automatically be set to `Astro`.

- [ ] **Step 2: Configure Redirects**
  Verify that `nodes-landing/vercel.json` is correctly interpreted by Vercel for auth redirects.

---

### Task 4: DNS Configuration (Instructions)

- [ ] **Step 1: Add Domain to Vercel**
  - In the Vercel project settings, go to **Domains**.
  - Add `info.nodes-tracker.ru`.

- [ ] **Step 2: Update Reg.ru DNS**
  - Log in to your Reg.ru account.
  - For domain `nodes-tracker.ru`, add a **CNAME** record:
    - Subdomain: `info`
    - Value: `cname.vercel-dns.com`
  - Wait for propagation (usually 5-30 minutes).
