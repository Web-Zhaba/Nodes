# Design Document: Personalization & Integrations (Phase 5)

**Date:** 2026-03-06  
**Status:** Approved  
**Topic:** Theming, Localization, Account Management, and Google Calendar Integration.

## 1. Overview
This phase focuses on making the "Nodes" application fully adaptable to the user's needs, both visually and functionally. It includes a robust theming engine, deep localization, comprehensive account security, and external service synchronization.

## 2. Architecture & Components

### 2.1 Theming Engine (Theming 2.0)
- **Concept:** Transform static Tailwind colors into dynamic CSS variables.
- **Data Model:** Store a `theme_config` JSON in the `profiles` table.
  ```json
  {
    "dark": { "primary": "#...", "background": "#..." },
    "light": { "primary": "#...", "background": "#..." }
  }
  ```
- **Implementation:** 
  - A `useTheme` hook that listens for changes and updates `:root` style properties.
  - A `ColorPicker` component in the Profile Page for selecting individual channel colors.

### 2.2 Deep Localization
- **Library:** `i18next` + `react-i18next`.
- **Scope:** 
  - UI labels (translation files).
  - Date/Time formatting (Intl API).
  - Timezone & First Day of Week settings (stored in `profiles`).
- **Workflow:** Implement a `LanguageSelector` that persists choice to Supabase.

### 2.3 Account Management
- **Security:** 
  - Email/Password update flows using `supabase.auth.updateUser`.
  - Social Auth Linking (Linking Google/Github to existing email account).
  - Session Management: List active sessions using Supabase and provide "Sign out from all devices" functionality.

### 2.4 External Integration (Google Calendar)
- **Type:** Two-way synchronization.
- **Backend:** 
  - Supabase Edge Functions to handle OAuth tokens and Google Calendar API requests.
  - Database table `integrations` to store encrypted access/refresh tokens.
- **Logic:**
  - **Outgoing:** Push "Pulses" or "Node Deadlines" to a specific "Nodes" calendar.
  - **Incoming:** Listen for events with specific tags/names and automatically trigger a "Pulse" in the app.

## 3. Data Flow
1. User changes a color or language on the **ProfilePage**.
2. **Zustand store** (`useUserStore` or updated `useAppStore`) updates optimistically.
3. **React Query** mutation persists changes to the `profiles` table in Supabase.
4. UI reacts instantly via CSS variable updates or `i18n` context changes.

## 4. UI/UX (Profile Page Structure)
- **Sidebar Tabs:**
  - **General:** Profile info, Language, Timezone.
  - **Appearance:** Theme toggle, Custom palette (Color pickers).
  - **Security:** Email, Password, Active sessions.
  - **Integrations:** Google Calendar connect/disconnect, Sync settings.

## 5. Testing Strategy
- **Unit Tests:** Theming hook logic, translation key existence.
- **Integration Tests:** Supabase Auth flows, Edge Function mock tests for Calendar API.
- **E2E Tests:** Switching languages, changing primary color and verifying it persists after reload.
