# Localization Design: English & Russian

**Date:** 2026-05-09
**Status:** Approved

## Overview
Implement a robust internationalization (i18n) system for the "Nodes" project, supporting English and Russian languages. The system uses a hybrid synchronization approach: local state for immediate UI feedback and Supabase persistence for cross-device consistency.

## Architecture

### Tools
- **i18next**: Core i18n logic.
- **react-i18next**: React bindings and hooks.
- **i18next-browser-languagedetector**: Automatic language detection.

### Directory Structure
```
src/
  lib/
    i18n/
      index.ts          # Initialization and config
      locales/
        en.json         # English translations
        ru.json         # Russian translations
```

### State Management & Sync
1. **Initial Load**:
   - Priority: Supabase Profile > LocalStorage > Browser Language > Default (ru).
2. **Persistence**:
   - Change triggers an update to `i18next`.
   - Update `localStorage` for guest/fast access.
   - Update `profiles` table in Supabase via `authService` or a dedicated hook.

## Technical Details

### Type Safety
Configure `i18next` custom types to enable IDE autocompletion for translation keys.

### Components
- **LanguageSwitcher**: Integrated into `RegionalSection.tsx`.
- **Global Context**: `I18nextProvider` wrapped in `main.tsx`.

## Key Terms Translation Mapping
| Term (RU) | Term (EN) |
|-----------|-----------|
| Узел      | Node      |
| Импульс   | Pulse     |
| Стабильность| Stability |
| Коннектор | Connector |
| Ядро      | Core      |
| Масса     | Mass      |
| Бинарный  | Binary    |
| Количество| Quantity  |
| Длительность| Duration |
