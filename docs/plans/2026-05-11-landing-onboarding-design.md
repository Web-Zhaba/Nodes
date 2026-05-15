# Design: Landing Page + Onboarding Wizard

**Date:** 2026-05-11
**Approach:** Demo-Driven (Approach B) — Interactive landing + guided onboarding
**Status:** Approved

---

## 1. Landing Page

### Stack

- **Astro** (SSG) — separate project `nodes-landing/`
- **React island** — only for interactive Hero graph demo
- **Tailwind v4** — same palette as main SPA (neutral base)
- **i18n** — EN + RU via Astro routing (`/en/`, `/ru/`), JSON translation files

### File Structure

```
nodes-landing/
├── src/
│   ├── layouts/
│   │   └── BaseLayout.astro
│   ├── components/
│   │   ├── Hero.astro
│   │   ├── HeroGraph.tsx           # React island: mini-graph demo
│   │   ├── HowItWorks.astro
│   │   ├── Philosophy.astro
│   │   ├── Features.astro
│   │   ├── Pricing.astro           # Free / Pro placeholder (future Stripe)
│   │   ├── CTASection.astro
│   │   ├── Footer.astro
│   │   └── LanguageSwitcher.astro
│   ├── pages/
│   │   ├── index.astro             # EN (default)
│   │   └── ru/
│   │       └── index.astro         # RU
│   ├── i18n/
│   │   ├── en.json
│   │   └── ru.json
│   └── styles/
│       └── global.css
├── astro.config.mjs
├── tailwind.config.mjs
└── package.json
```

### Sections (scroll order)

| # | Section | Content | Interactivity |
|---|---------|---------|--------------|
| 1 | **Hero** | "Your Second Brain, Visualized" + delegation of knowledge subtext | `HeroGraph.tsx` — `react-force-graph-2d` with demo data (5 cores + 15 nodes, auto-rotate). Click on node → toast "This is your node. Sign up to create your own." |
| 2 | **How It Works** | 3 illustrated steps: Create Cores → Add Nodes → Track with Impulses | Scroll-triggered appear animations |
| 3 | **Philosophy** | "Delegating knowledge frees your mind" — second brain positioning | Background quote/animation |
| 4 | **Features** | 4-6 cards: Graph Visualization, Stability Engine, Cores & Connectors, Multi-device, Analytics | Hover effects |
| 5 | **Pricing** | Free / Pro plan cards (placeholder for future Stripe integration) | — |
| 6 | **CTA** | "Start building your neural network" + Sign Up button → SPA redirect | — |
| 7 | **Footer** | Links, language switch, copyright | — |

### Key Decisions

- **HeroGraph** is the only React island — minimizes JS bundle
- **Deploy** — separate Vercel project, bound to root domain or subdomain
- **SEO** — Astro SSG, OG tags, structured data, sitemap
- **Pricing** — placeholder UI ready for Stripe/LemonSqueezy when monetization phase starts

---

## 2. Onboarding Wizard

### Mechanics

- Full-screen overlay (`fixed inset-0 z-50`) for new users only
- Trigger: `NodesListPage` detects `useUserNodes()` returns empty array → open wizard
- Dismiss: after step 5 or "Skip" on any step. Flag `onboarding_completed` saved to `Profile` (new Supabase column)

### Steps (approved order)

| Step | Screen | User Action | Created in Supabase |
|------|--------|-------------|---------------------|
| 1 | **Welcome** | "Let's build your neural network" — Start / Skip | — |
| 2 | **Create Node** | Choose type (binary/quantity/duration) + name + connectors (existing or new) | `Node` + `Connector` + `NodeConnector` |
| 3 | **First Impulse** | "Mark it done!" — click impulse on created node | `Impulse` + stability recalc |
| 4 | **Create Core** | Name + color → node from step 2 attaches to core | `Core` + `CoreConnector` |
| 5 | **See Your Graph** | Graph with user's data + analytics preview + "Go to Dashboard" | — |

### Rationale for order

Bottom-up: concrete action first (node → impulse), then organization (core), then overview (graph). User sees _why_ a core is needed — before step 4, their node hangs alone; after creating a core, they see it as part of a structure on the graph.

### Technical Implementation

- **Component**: `src/features/onboarding/OnboardingWizard.tsx` — full-page overlay
- **Step components**: `WelcomeStep`, `CreateNodeStep`, `FirstImpulseStep`, `CreateCoreStep`, `SeeGraphStep`
- **State**: `useOnboardingStore` (Zustand): `{ step, isOpen, nodeData, coreData }`
- **Data**: Real Supabase mutations via TanStack Query (reuse existing `useCreateNode`, `useCreateCore`, `useCreateImpulse`)
- **Trigger**: `NodesListPage` — if `useUserNodes()` returns empty → open wizard
- **Persistence**: `onboarding_completed` column in `Profile` table (Supabase migration)
- **i18n**: New `onboarding` namespace in `en.json` / `ru.json`
- **Animations**: Framer Motion slide transitions between steps

### Visual Style

- Dark background with semi-transparent overlay (Shadcn dialog style)
- Centered card container, max-w-lg
- Progress bar at top (step X of 5)
- Next / Skip / Back buttons at bottom

---

## 3. Supabase Changes

New migration: `005_onboarding.sql`

```sql
ALTER TABLE profiles ADD COLUMN onboarding_completed BOOLEAN NOT NULL DEFAULT FALSE;
```

---

## 4. Dependencies

### Landing (new project)

- `astro` — framework
- `@astrojs/react` — React island support
- `react-force-graph-2d` — hero graph demo (shared dependency with SPA)
- `tailwindcss` v4 — styling
- `@astrojs/vercel` — deployment adapter

### Onboarding (existing SPA)

- `framer-motion` — already installed, used for wizard transitions
- No new npm dependencies needed

---

## 5. Out of Scope

- Stripe/LemonSqueezy integration (Pricing is placeholder only)
- Mobile app / Capacitor
- Offline / PWA
- Notifications
- Deep Storage / External Sync
