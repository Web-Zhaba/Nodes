# Bundle Optimization Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Optimize the frontend bundle size by fixing tree-shaking issues related to `lucide-react` icons, separating heavy Zod schemas from core API functions, and enabling standard bundler optimizations.

**Architecture:** 
1. Replace the static `Icons` barrel object with dynamic imports using `lucide-react/dynamicIconImports` to ensure only used icons are loaded in the chunk that needs them.
2. Split `djangoApi.ts` into specialized files (`analytics.ts` for heavy schemas, `stability.ts` for lightweight core logic) to prevent "Shared Chunk Bloat".
3. Add `"sideEffects": false` to `package.json` to empower Vite/Rollup's dead code elimination.

**Tech Stack:** React, Vite, Rollup, Lucide React, Zod.

---

### Task 1: Package.json Optimizations & Test Setup

**Files:**
- Modify: `package.json`
- Create: `src/tests/bundleConfig.test.ts`

**Step 1: Write the test to enforce `sideEffects: false`**

```typescript
// src/tests/bundleConfig.test.ts
import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('Bundle Configuration', () => {
  it('should have sideEffects set to false in package.json to enable tree shaking', () => {
    const packageJsonPath = path.resolve(__dirname, '../../package.json');
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
    expect(packageJson.sideEffects).toBe(false);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm run test:run src/tests/bundleConfig.test.ts`
Expected: FAIL because `sideEffects` is not defined.

**Step 3: Write minimal implementation**

Add `"sideEffects": false` to the root of `package.json`.

**Step 4: Run test to verify it passes**

Run: `npm run test:run src/tests/bundleConfig.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add package.json src/tests/bundleConfig.test.ts
git commit -m "chore: add sideEffects: false to package.json and enforce via test"
```

---

### Task 2: Refactor API Logic (Split djangoApi.ts)

**Files:**
- Create: `src/lib/api/analytics.ts`
- Create: `src/lib/api/stability.ts`
- Delete: `src/lib/djangoApi.ts`
- Modify: `src/features/nodes/hooks/useImpulsesQuery.ts`, `src/pages/NodesListPage.tsx`, `src/pages/AnalyticsPage.tsx` (and any other importers)

**Step 1: Create new split files**

Move `calculateStability` and `recordImpulse` (and `getAuthToken`) to `src/lib/api/stability.ts`.
Move Analytics Zod schemas and `fetchAnalyticsHistory` to `src/lib/api/analytics.ts`.
Ensure both files import `supabase` correctly from `../supabase`.

**Step 2: Update all importers**

Use IDE search to find all references to `@/lib/djangoApi` and replace them with `@/lib/api/stability` or `@/lib/api/analytics` as appropriate.

**Step 3: Run existing tests and TS check**

Run: `npm run build` (runs `tsc -b` and `vite build`)
Expected: PASS (no type errors, build successful)

**Step 4: Commit**

```bash
git add src/lib/api src/lib/djangoApi.ts src/features src/pages
git commit -m "refactor: split djangoApi into stability and analytics for better tree shaking"
```

---

### Task 3: Fix Lucide React Icons Barrel (Dynamic Loading)

*Note: Since Lucide React exports components with PascalCase names but `dynamicIconImports` uses kebab-case keys, we need a helper to map our DB strings (e.g. 'Brain') to kebab-case ('brain').*

**Files:**
- Modify: `src/lib/icons.ts` (Remove static `Icons` object)
- Create: `src/components/ui/DynamicIcon.tsx`
- Modify: `src/features/nodes/components/NodeCardHeader.tsx`, `src/features/dashboard/components/DailyFocusSelector.tsx`, `src/features/nodes/components/IconPicker.tsx`, `src/features/graph-visualization/lib/iconCache.ts`

**Step 1: Create `DynamicIcon` component**

```tsx
// src/components/ui/DynamicIcon.tsx
import { lazy, Suspense, memo } from 'react';
import { LucideProps } from 'lucide-react';
import dynamicIconImports from 'lucide-react/dynamicIconImports';

interface DynamicIconProps extends LucideProps {
  name: string; // e.g. "Brain", "Circle", "Flame"
  fallback?: React.ReactNode;
}

// Helper to convert PascalCase to kebab-case for lucide dynamic imports
const toKebabCase = (str: string) => str.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();

export const DynamicIcon = memo(({ name, fallback, ...props }: DynamicIconProps) => {
  const kebabName = toKebabCase(name) as keyof typeof dynamicIconImports;
  
  if (!dynamicIconImports[kebabName]) {
    const CircleIcon = lazy(dynamicIconImports['circle']);
    return <Suspense fallback={fallback || <div className="w-4 h-4 animate-pulse bg-muted rounded-full" />}><CircleIcon {...props} /></Suspense>;
  }

  const LucideIcon = lazy(dynamicIconImports[kebabName]);

  return (
    <Suspense fallback={fallback || <div className="w-4 h-4 animate-pulse bg-muted rounded-full" />}>
      <LucideIcon {...props} />
    </Suspense>
  );
});
```

**Step 2: Refactor `iconCache.ts` (ForceGraph Optimization)**

In `src/features/graph-visualization/lib/iconCache.ts`, instead of getting the component synchronously from `Icons`, we will dynamically import it:
```typescript
import dynamicIconImports from 'lucide-react/dynamicIconImports';

// ... inside renderIconToCache
const kebabName = name.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase() as keyof typeof dynamicIconImports;
const importFn = dynamicIconImports[kebabName] || dynamicIconImports['circle'];
const module = await importFn();
const IconComponent = module.default;
// ... rest of the renderToStaticMarkup logic
```

**Step 3: Update Components to use `DynamicIcon`**

Replace `<IconComponent />` logic in `NodeCardHeader`, `DailyFocusSelector`, etc., with `<DynamicIcon name={node.icon} />`.
Keep `src/lib/icons.ts` only as an array of strings for `IconPicker` (`export const AVAILABLE_ICONS = ["Activity", ...]`).

**Step 4: Run Tests & Build**

Run: `npm run build`
Run: `npm run test:run`
Expected: Everything compiles, existing UI tests pass.

**Step 5: Commit**

```bash
git add .
git commit -m "perf: replace static Icons barrel with dynamic imports"
```

---

### Task 4: Verify Bundle Stats

**Step 1: Generate Visualizer Report**
Run: `npm run build`
Check the output in `dist/` and `bundle-stats.html`. 

**Step 2: Manual Check**
Ensure that the main `index-*.js` chunk does not contain hundreds of SVG paths from `lucide-react`, and that `react-dom/server` is strictly isolated to the lazy chunk for `GraphPage`.

**Step 3: Final Polish**
If everything is clean, we are done.
