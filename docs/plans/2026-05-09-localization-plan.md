# Localization Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Implement English and Russian localization using i18next with Supabase synchronization.

**Architecture:** Hybrid approach using i18next for runtime translations, Zustand for global state, and Supabase for persistent user preferences.

**Tech Stack:** i18next, react-i18next, i18next-browser-languagedetector, Zustand, Supabase.

---

### Task 1: Install Dependencies
**Files:**
- Modify: `package.json` (via npm install)

**Step 1: Install i18n packages**
Run: `npm install i18next react-i18next i18next-browser-languagedetector`
Expected: Packages added to `package.json`.

---

### Task 2: Create Translation Files
**Files:**
- Create: `src/lib/i18n/locales/en.json`
- Create: `src/lib/i18n/locales/ru.json`

**Step 1: Create RU translations**
Define initial Russian strings (keys for navigation, nodes, profile).

**Step 2: Create EN translations**
Translate all RU strings to English.

---

### Task 3: Initialize i18next
**Files:**
- Create: `src/lib/i18n/index.ts`
- Modify: `src/main.tsx`

**Step 1: Configure i18next**
Set up i18next with detection and resources.

**Step 2: Wrap App with I18nextProvider**
Import the config in `main.tsx`.

---

### Task 4: Update State Management
**Files:**
- Modify: `src/store/useAppStore.ts`

**Step 1: Add language state**
Add `language` field and `setLanguage` action to `useAppStore`.
Handle i18next language change inside the action.

---

### Task 5: Implement Language Switcher
**Files:**
- Modify: `src/features/profile/sections/RegionalSection.tsx`

**Step 1: Add Select component for language**
Use Radix/Shadcn Select to allow switching between 'ru' and 'en'.
Connect to `useAppStore`.

---

### Task 6: Supabase Synchronization
**Files:**
- Modify: `src/services/auth.service.ts`
- Modify: `src/hooks/useAuth.ts`

**Step 1: Add language update to authService**
Method to update profile's language.

**Step 2: Sync language on login/init**
Update `useAuth` to set the app's language from the user profile after authentication.

---

### Task 7: Localize UI Components (Phased)
**Files:**
- Modify: `src/widgets/Layout.tsx` (Navbar)
- Modify: `src/pages/NodesListPage.tsx`
- Modify: `src/features/nodes/components/NodeCard.tsx`

**Step 1: Replace hardcoded strings with `t()`**
Starting with the main layout and node lists.
