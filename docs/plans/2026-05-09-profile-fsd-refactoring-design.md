# Design Doc: Profile Feature FSD Refactoring

## Overview
Refactor the `profile` feature to strictly follow Feature-Sliced Design (FSD) principles. This involves restructuring the internal folder hierarchy, extracting logic into appropriate layers (api, model, ui, lib), and defining a clear public API through `index.ts`.

## Current State
- Monolithic tab components in `features/profile/` containing mixed UI and logic.
- Hardcoded constants (themes, fonts) inside UI components.
- Use of `any` types for complex data structures like sessions.
- Inconsistent location of API hooks and services.

## Proposed Architecture

### Folder Structure
```
src/features/profile/
├── api/                # Data fetching and services
│   ├── profile.service.ts
│   ├── useProfileQuery.ts
│   └── useSecurityActions.ts
├── model/              # Business logic, types, and constants
│   ├── types.ts
│   └── constants.ts
├── ui/                 # React components
│   ├── GeneralTab.tsx
│   ├── AppearanceTab.tsx
│   ├── SecurityTab.tsx
│   ├── IntegrationsTab.tsx
│   └── sections/
└── index.ts            # Public API
```

### Layer Definitions

#### 1. API Layer (`api/`)
- Move `profile.service.ts` here.
- Move `useProfileQuery.ts` (from `hooks/`) here.
- Create `useSecurityActions.ts` to handle session management and password resets (extracted from `SecurityTab.tsx`).

#### 2. Model Layer (`model/`)
- **`types.ts`**: Define interfaces for `Profile`, `UserSession`, `ThemePreset`, etc.
- **`constants.ts`**: Extract `THEME_PRESETS`, `FONT_OPTIONS`, `RADIUS_OPTIONS`, `CUSTOM_TOKENS` from `AppearanceTab.tsx`.

#### 3. UI Layer (`ui/`)
- Move all tab components into `ui/`.
- Update imports to use the new `api` and `model` layers.

#### 4. Public API (`index.ts`)
- Export only the main tab components needed by `ProfilePage.tsx`.

## Implementation Plan

### Phase 1: Preparation (Model Layer)
1. Create `src/features/profile/model/types.ts` and define all necessary interfaces.
2. Create `src/features/profile/model/constants.ts` and migrate theme/font constants.

### Phase 2: API Layer Refactoring
1. Move `profile.service.ts` to `api/`.
2. Move `useProfileQuery.ts` to `api/`.
3. Create `useSecurityActions.ts` and migrate logic from `SecurityTab.tsx`.

### Phase 3: UI Restructuring
1. Create `ui/` folder and move tabs and `sections/` there.
2. Update all imports within UI components.

### Phase 4: Final Cleanup
1. Create `index.ts` and export the tabs.
2. Update `ProfilePage.tsx` to import from `@/features/profile`.
3. Remove old `hooks/` directory in `features/profile/`.

## Success Criteria
- [ ] No `any` types in `SecurityTab` or `AppearanceTab`.
- [ ] UI components contain only rendering logic.
- [ ] Business logic and constants are isolated in the `model` layer.
- [ ] Imports follow FSD layer boundaries.
