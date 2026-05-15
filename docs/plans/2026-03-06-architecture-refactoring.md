# Architecture Refactoring Plan (Preparation for Complex Graph Logic)

> **For Claude:** Use this document when starting the refactoring phase. REQUIRED SUB-SKILL: executing-plans.

This plan details the steps required to address the technical debt accumulated during the rapid MVP development of Nodes. These changes are crucial before implementing the heavy D3-force graph visualization and Django analytics engine.

## Goal: 
Transition from a monolithic frontend state (Arrays in Zustand) to a normalized, feature-sliced, and query-optimized architecture.

---

## Phase 1: State Normalization (From Arrays to Hash Maps)
*Why: O(1) lookups are mandatory for acceptable FPS in the force-directed graph when mapping Nodes to Cores.*

### Task 1.1: Update TypeScript Models
1.  **File:** `nodes-frontend/src/types/index.ts`
2.  **Action:** Define normalized versions of the state shapes.
    ```typescript
    // Example:
    export type NormalizedData<T> = Record<string, T>;
    ```
    
### Task 1.2: Refactor Zustand Store Structure (Store Separation)
1.  **File:** `nodes-frontend/src/store/useNodesStore.ts` (We will eventually break this apart in Phase 3, but for now, we normalize within it).
2.  **Action:** Change `nodes: Node[]` to `nodes: Record<string, Node>`. Do the same for `cores`, `connectors`, and `coreConnectors`.
3.  **Action:** Update all CRUD actions within the store:
    *   `setNodes`: Convert incoming array from Supabase to a Record using `reduce`.
    *   `addNode`: Add by `Node.id` as the key.
    *   `removeNode`: use `delete` operator or omit from record.
    *   `updateNode`: merge partial updates into specific `Node.id`.

### Task 1.3: Update Selectors and Components
1.  **Action:** Global search for `useNodesStore((state) => state.nodes)` and `state.cores`.
2.  **Action:** Wherever arrays map over the state (`nodes.map(...)`), convert `Object.values(nodes).map(...)`.
3.  **Action:** Rewrite `getNodesForCore` to utilize O(1) lookups where possible instead of deep filtering nested arrays.

---

## Phase 2: Integrating React Query (Separation of Server vs. Client State)
*Why: Zustand should not handle async data fetching, loading states, or caching. React Query manages Server State optimally with optimistic updates.*

### Task 2.1: Setup TanStack Query
1.  **Action:** `npm install @tanstack/react-query @tanstack/react-query-devtools`
2.  **File:** `nodes-frontend/src/App.tsx` or `main.tsx`
3.  **Action:** Wrap the application in `<QueryClientProvider>`.

### Task 2.2: Migrate `coreService` & `nodeService` to Custom Hooks
1.  **File:** `nodes-frontend/src/features/core-management/hooks/useCoresQuery.ts` (Create new folder/file).
2.  **Action:** Create `useCores` (utilizing `useQuery` over `getUserCores`).
3.  **Action:** Create `useCreateCore` (utilizing `useMutation` over `createCore`). Implement **Optimistic Updates** on mutation start.
4.  **Repeat:** Do the same for `Nodes` and `Connectors`.

### Task 2.3: Gut Zustand of Server Data
1.  **File:** `nodes-frontend/src/store/useNodesStore.ts`
2.  **Action:** Delete `isLoading`, `error`, `nodes`, `cores`, `connectors` from Zustand completely.
3.  **Action:** Zustand should *only* keep UI state: `todayValues` (if not synced back immediately), `focusNodeIds`, `selectedCoreId` (from GraphPage), etc.

### Task 2.4: Refactor Pages to use Queries
1.  **File:** `nodes-frontend/src/pages/GraphPage.tsx`
2.  **Action:** Remove the massive `useEffect` block that fetches all data.
3.  **Action:** Replace with `const { data: cores, isLoading: isCoresLoading } = useCores()`. Let React Query handle the caching and parallel fetching under the hood.

---

## Phase 3: Strict Feature-Sliced Design (FSD) Enforcement
*Why: Prevent spaghetti imports (GraphPage directly importing internal services of CoreManagement).*

### Task 3.1: Define Cross-Feature Boundaries (Entities Layer)
1.  **Action:** Move atomic data representations out of specific features.
2.  **Folders:** 
    *   Move `nodeService.ts` and baseline Node types to `src/entities/node`.
    *   Move `coreService.ts` and baseline Core types to `src/entities/core`.

### Task 3.2: Create Public APIs (Index files) for Features
1.  **Action:** For `src/features/core-management/`, create an `index.ts`.
2.  **Action:** Export *only* what the rest of the app is allowed to use. 
    ```typescript
    // e.g., src/features/core-management/index.ts
    export { CoreMocManager } from './components/CoreMocManager';
    export { CreateCoreForm } from './components/CreateCoreForm';
    // Internal hooks/services are NOT exported here if they shouldn't be used outside.
    ```

### Task 3.3: Refactor Page Imports
1.  **File:** `nodes-frontend/src/pages/GraphPage.tsx`
2.  **Action:** Ensure imports only hit the public API of a feature, never a deep internal path like `features/core-management/components/...`.
3.  **Action:** Review `NodesListPage.tsx` to ensure it only imports exposed Widgets or Features, pushing specific logic down the FSD hierarchy.

---

## Review & Testing
1.  **Action:** Validate that the application compiles without TypeScript errors.
2.  **Action:** Manually test all CRUD operations. Verify optimistic updates flash instantly and revert accurately on network failure.
3.  **Action:** Use React Query Devtools to verify cache hits and background refetching logic.
