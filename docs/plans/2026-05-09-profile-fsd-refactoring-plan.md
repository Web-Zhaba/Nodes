# Profile Feature FSD Refactoring Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Restructure the profile feature to follow FSD principles, improve type safety, and isolate business logic.

**Architecture:** Moving code to api, model, and ui layers within the profile feature slice. Defining a public API in index.ts.

**Tech Stack:** React, TypeScript, Supabase, Tailwind CSS, Lucide Icons.

---

### Task 1: Create Model Layer (Types and Constants)

**Files:**
- Create: `nodes-frontend/src/features/profile/model/types.ts`
- Create: `nodes-frontend/src/features/profile/model/constants.ts`
- Modify: `nodes-frontend/src/features/profile/AppearanceTab.tsx` (to remove constants)

**Step 1: Define types in model/types.ts**
Create the file with `Profile` and `UserSession` interfaces.

**Step 2: Extract constants to model/constants.ts**
Move `THEME_PRESETS`, `FONT_OPTIONS`, `RADIUS_OPTIONS`, and `CUSTOM_TOKENS` from `AppearanceTab.tsx` to `model/constants.ts`.

**Step 3: Update AppearanceTab.tsx imports**
Import constants from `./model/constants` and types from `./model/types`.

**Step 4: Commit**
```bash
git add nodes-frontend/src/features/profile/model/* nodes-frontend/src/features/profile/AppearanceTab.tsx
git commit -m "refactor(profile): create model layer and extract constants"
```

---

### Task 2: Create API Layer and Services

**Files:**
- Create: `nodes-frontend/src/features/profile/api/profile.service.ts`
- Create: `nodes-frontend/src/features/profile/api/useProfileQuery.ts`
- Create: `nodes-frontend/src/features/profile/api/useSecurityActions.ts`
- Remove: `nodes-frontend/src/features/profile/profile.service.ts`
- Remove: `nodes-frontend/src/features/profile/hooks/useProfileQuery.ts`

**Step 1: Move profile.service.ts to api/**
Update internal imports if necessary.

**Step 2: Move useProfileQuery.ts to api/**
Update imports to point to the new service location.

**Step 3: Implement useSecurityActions.ts**
Extract `fetchSessions`, `handleResetPasswordEmail`, and `handleSignOutOthers` logic from `SecurityTab.tsx` into this hook.

**Step 4: Commit**
```bash
git add nodes-frontend/src/features/profile/api/*
git commit -m "refactor(profile): create api layer and migrate services/hooks"
```

---

### Task 3: Restructure UI Layer

**Files:**
- Create directory: `nodes-frontend/src/features/profile/ui`
- Move: `nodes-frontend/src/features/profile/*.tsx` to `ui/`
- Move: `nodes-frontend/src/features/profile/sections/` to `ui/sections/`

**Step 1: Move components to ui/**
Move `GeneralTab.tsx`, `AppearanceTab.tsx`, `SecurityTab.tsx`, `IntegrationsTab.tsx` to `ui/`.

**Step 2: Update internal imports in UI components**
Fix imports for types, constants, and api hooks using relative paths or `@/features/profile/...`.

**Step 3: Commit**
```bash
git add nodes-frontend/src/features/profile/ui/*
git commit -m "refactor(profile): move UI components to ui/ layer"
```

---

### Task 4: Define Public API and Update Page

**Files:**
- Create: `nodes-frontend/src/features/profile/index.ts`
- Modify: `nodes-frontend/src/pages/ProfilePage.tsx`

**Step 1: Create index.ts**
Export the four tab components.

**Step 2: Update ProfilePage.tsx**
Change imports from `@/features/profile/TabName` to `@/features/profile`.

**Step 3: Final verification**
Check if the profile page still works as expected (visual check).

**Step 4: Commit**
```bash
git add nodes-frontend/src/features/profile/index.ts nodes-frontend/src/pages/ProfilePage.tsx
git commit -m "refactor(profile): define public API and update page imports"
```
