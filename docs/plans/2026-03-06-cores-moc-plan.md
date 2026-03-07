# Cores MOC Logic Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Transform Cores into semantic hubs (MOCs) that aggregate Nodes automatically based on shared Connectors (tags).

**Architecture:** 
- **Database:** Introduce a `core_connectors` junction table to enable many-to-many tagging for Cores.
- **Frontend State:** Update Zustand store to manage Core-Connector mappings and provide a derived selector for Node-Core membership.
- **UI:** Implement a tag selection interface within Core management.

**Tech Stack:** React 19, TypeScript, Supabase, Zustand.

---

### Task 1: Supabase Schema Update

**Files:**
- Modify: `docs/SCHEMA.sql` (Add migration block at the end)

**Step 1: Add core_connectors table**
```sql
-- Link Cores to the Connectors they aggregate
CREATE TABLE IF NOT EXISTS core_connectors (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  core_id UUID REFERENCES cores(id) ON DELETE CASCADE NOT NULL,
  connector_id UUID REFERENCES connectors(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(core_id, connector_id)
);

-- Enable RLS
ALTER TABLE core_connectors ENABLE ROW LEVEL SECURITY;

-- Policy: Users can manage their own core_connectors through cores
CREATE POLICY "Users can manage own core_connectors"
  ON core_connectors FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM cores
      WHERE cores.id = core_connectors.core_id
      AND cores.user_id = (select auth.uid())
    )
  );
```

**Step 2: Commit changes**
```bash
git add docs/SCHEMA.sql
git commit -m "db: add core_connectors table for MOC logic"
```

---

### Task 2: Update TypeScript Types

**Files:**
- Modify: `nodes-frontend/src/types/index.ts`

**Step 1: Add CoreConnector interface**
```typescript
/**
 * CoreConnector — связь ядра с тегом (MOC mapping)
 */
export interface CoreConnector {
  id: string;
  core_id: string;
  connector_id: string;
  created_at: string;
}
```

**Step 2: Commit**
```bash
git add nodes-frontend/src/types/index.ts
git commit -m "types: add CoreConnector interface"
```

---

### Task 3: Update Zustand Store

**Files:**
- Modify: `nodes-frontend/src/store/useNodesStore.ts`

**Step 1: Update State and Actions**
Add `coreConnectors` to `NodesState` interface and implement actions: `setCoreConnectors`, `addCoreConnector`, `removeCoreConnector`.

**Step 2: Implement selectors**
Add a helper function to get nodes for a core:
```typescript
export const getNodesForCore = (state: NodesState, coreId: string) => {
  const coreTags = state.coreConnectors
    .filter(cc => cc.core_id === coreId)
    .map(cc => cc.connector_id);
  
  return state.nodes.filter(node => 
    node.connector_ids?.some(tagId => coreTags.includes(tagId))
  );
};
```

**Step 3: Commit**
```bash
git add nodes-frontend/src/store/useNodesStore.ts
git commit -m "store: add coreConnectors state and selectors"
```

---

### Task 4: Create Core MOC Manager UI

**Files:**
- Create: `nodes-frontend/src/features/core-management/components/CoreMocManager.tsx`

**Step 1: Implement Tag Selector**
Create a component that lists all available `connectors` with checkboxes to link/unlink them from the current `core_id`.

**Step 2: Commit**
```bash
git add nodes-frontend/src/features/core-management/components/CoreMocManager.tsx
git commit -m "feat: add CoreMocManager for tag assignment"
```

---

### Task 5: Integration & Verification

**Files:**
- Modify: `nodes-frontend/src/pages/HomePage.tsx` (or wherever Cores are managed)

**Step 1: Add MOC Manager to Core Edit Modal**
Integrate `CoreMocManager` into the existing core editing flow.

**Step 2: Manual Verification**
1. Create a Connector (Tag) `#sport`.
2. Create a Core "Health".
3. Use `CoreMocManager` to link `#sport` to "Health".
4. Create a Node "Running" with tag `#sport`.
5. Verify (via logs/UI) that "Running" is now semantically part of "Health".

**Step 3: Commit**
```bash
git add nodes-frontend/src/pages/HomePage.tsx
git commit -m "feat: integrate MOC logic into UI flow"
```
