# Design Spec: Landing Page Setup & Deployment (2026-05-23)

## 1. Overview
The goal is to set up a dedicated local startup script for the `nodes-landing` project (Astro-based) and prepare it for Vercel deployment using a sub-domain of the existing project domain.

## 2. Architecture & Components

### 2.1. Local Startup Script (`run-landing.bat`)
A professional batch script located in the project root to manage the landing page development environment.
- **Location:** `./run-landing.bat`
- **Features:**
    - Checks for the existence of the `nodes-landing` directory.
    - Checks for `node_modules` and prompts for `npm install` if missing.
    - Launches `npm run dev` in a new window with a custom title.
    - Visual styling (color/headers) matching the main `run.bat`.

### 2.2. Vercel Deployment Strategy
Deployment via GitHub integration, scoped to the landing page subdirectory.
- **Root Directory:** `nodes-landing`
- **Build Settings:**
    - Framework: Astro
    - Build Command: `npm run build`
    - Output Directory: `dist`
- **Vercel Project Setup:** A separate Vercel project (e.g., `nodes-landing`) will be created/linked to the repository.

### 2.3. Domain Configuration
The landing page will be hosted on a subdomain of the primary domain.
- **Domain:** `info.nodes-tracker.ru`
- **Provider:** Reg.ru
- **DNS Record:** 
    - Type: `CNAME`
    - Host: `info`
    - Value: `cname.vercel-dns.com` (to be confirmed via Vercel dashboard)

## 3. Data Flow & Integration
The landing page is a static Astro site. It will handle its own routing as defined in `nodes-landing/vercel.json` (redirects for auth/login to the main app).

## 4. Implementation Steps
1. Create `run-landing.bat`.
2. Verify local execution.
3. Guide the user through Vercel Project creation for the `nodes-landing` directory.
4. Guide the user through DNS setup in Reg.ru.

## 5. Success Criteria
- Running `run-landing.bat` successfully starts the Astro dev server.
- Pushing to GitHub triggers a Vercel build for the landing page.
- `info.nodes-tracker.ru` correctly serves the landing page content.
