# AGENTS.md — Nodes

## Project structure

Two separate packages (no workspace config — `cd` into each):
- **`nodes-frontend/`** — React 19 + Vite 7 + TypeScript 5.9 (strict) + Zustand 5 + TanStack Query + Tailwind v4 + Shadcn UI
- **`nodes-backend/`** — Django 6 + DRF + Python 3.12, deployed as Vercel serverless

Frontend is the primary codebase. Backend is a thin API layer over Supabase PostgreSQL.

## Commands (run from `nodes-frontend/`)

```bash
npm run dev          # Vite dev server (http://localhost:5173)
npm run build        # tsc -b && vite build  (typecheck is included)
npm run lint         # ESLint (flat config, ts + react-hooks + react-refresh)
npm run test         # Vitest (watch mode)
npm run test:run     # Vitest single run
npm run test:ui      # Vitest UI
npm run knip         # Dead-code detection (ignores src/components/ui/**)
```

Build runs typecheck first — if `tsc -b` fails, the build stops. Run `npm run build` to verify both.

## Commands (run from `nodes-backend/`)

```bash
venv\Scripts\python.exe manage.py runserver   # Django dev server (http://127.0.0.1:8000)
```

No test runner configured for backend. `run.bat` at repo root launches both servers.

## Architecture

Frontend talks to **two** backends:
1. **Supabase** (direct client) — auth, CRUD on nodes/cores/connectors/impulses
2. **Django API** (`/api/v1/`) — stability recalculation, impulse processing, analytics history

Auth flow: Supabase Auth → frontend gets JWT → passes `Authorization: Bearer <token>` to Django API. Django validates JWT via Supabase JWKS (supports both HS256 and ES256).

### Key API endpoints (Django)

- `POST /api/v1/stability/calculate/` — recalculate stability for user's nodes
- `POST /api/v1/impulses/action/` — record impulse via `process_pulse()` PostgreSQL function (raw SQL, not ORM)
- `GET /api/v1/analytics/history` — historical stability series + heatmap (cached 5 min)

### Django models: `managed = False`

All Django models have `Meta.managed = False`. The schema is owned by **Supabase** — do **not** run `makemigrations` or `migrate`. Schema lives in `docs/supabase-schema.sql`.

## Frontend source layout (`src/`)

Feature-sliced design:
- `entities/` — domain models (node, core, connector, graph)
- `features/` — feature modules (nodes, stability, analytics, connectors, core_management, dashboard, graph-visualization, profile, public-sharing)
- `widgets/` — composite components (Layout, ProtectedRoute)
- `pages/` — route-level pages
- `components/ui/` — Shadcn UI components (auto-generated, excluded from knip)
- `store/` — Zustand stores (useAppStore, useNodesStore, useAnalyticsStore, useThemeStore)
- `lib/` — supabase client, API helpers (`lib/api/stability.ts`), i18n, utils
- `config/` — app config (Supabase env vars)
- `hooks/` — useAuth, useTheme, useMediaQuery
- `services/` — auth.service.ts

## Path alias

`@/` → `./src/` — configured in both `vite.config.ts` and `tsconfig.json`/`tsconfig.app.json`.

## TypeScript strictness

`tsconfig.app.json` enables: `strict`, `noUnusedLocals`, `noUnusedParameters`, `verbatimModuleSyntax`, `erasableSyntaxOnly`, `noFallthroughCasesInSwitch`, `noUncheckedSideEffectImports`. Don't use `import type` syntax casually — `verbatimModuleSyntax` requires it for type-only imports.

## Testing

Vitest + jsdom + @testing-library/react. Setup file (`src/tests/setup.ts`) polyfills `ResizeObserver` and `PointerEvent` for Radix UI. Tests live in `src/tests/` and `__tests__/` subdirs inside features/store.

## Environment variables

**Frontend** (`.env.local`):
- `VITE_SUPABASE_URL` — required
- `VITE_SUPABASE_ANON_KEY` — required
- `VITE_DJANGO_API_URL` — optional, defaults to `http://127.0.0.1:8000/api/v1`

**Backend** (`.env`):
- `DATABASE_URL` — Supabase Postgres connection string
- `SUPABASE_JWT_SECRET` — for HS256 JWT validation
- `SUPABASE_URL` — for JWKS fetching
- `SECRET_KEY`, `DEBUG`, `ALLOWED_HOSTS`

## Shadcn UI

Style: `new-york`, base color: `neutral`, CSS variables enabled. Components install to `@/components/ui/`. Icon library: Lucide. Add new components via `npx shadcn@latest add <component>`.

## Mobile (Capacitor)

The frontend also builds as a native mobile app for Android and iOS via Capacitor.

### Mobile commands (run from `nodes-frontend/`)

```bash
npm run mobile:build       # npm run build && npx cap sync
npm run mobile:sync        # npx cap sync (copy web assets to native projects)
npm run mobile:open:android # Open Android Studio
npm run mobile:open:ios     # Open Xcode
```

### Mobile architecture notes

- **Router:** `HashRouter` is used (instead of `BrowserRouter`) because Capacitor serves from `file://`.
- **Native init:** `src/lib/capacitor.ts` initializes plugins (StatusBar, SplashScreen, Keyboard, App, Network) before React mounts.
- **Back button:** Handled via `@capacitor/app` listener — exits on main screen, otherwise navigates back.
- **Deep links:** URL scheme `nodes://` configured in `AndroidManifest.xml` and `Info.plist`. Hook lives in `src/hooks/useMobileNavigation.ts`.
- **Offline banner:** Shown via `@capacitor/network` when connection drops.
- **Safe areas:** CSS env vars + `mobile.css` handle notched devices.
- **API connectivity:** Android and iOS allow cleartext HTTP for local Django dev. Production uses HTTPS.

### Native project locations

- `nodes-frontend/android/` — Gradle project (generated by `npx cap add android`)
- `nodes-frontend/ios/` — Xcode project (generated by `npx cap add ios`)

These folders contain platform-specific configs. Web assets inside them are overwritten on every `cap sync`, but manifest/plist edits are preserved.

## Gotchas

- `vercel.json` at repo root is for frontend SPA rewrites; `nodes-backend/vercel.json` is separate for Django serverless deployment
- `rollup-plugin-visualizer` opens bundle stats in browser on every `vite build`
- `process_pulse()` is a PostgreSQL stored function — its definition is in Supabase/migrations, not in Django code
- i18n is initialized in `src/lib/i18n/` and imported in `main.tsx`
