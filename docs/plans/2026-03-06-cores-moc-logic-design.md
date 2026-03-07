# Design Doc: Cores as MOC (Map of Content) Logic

**Date:** 2026-03-06
**Status:** Approved by User
**Topic:** Implementing Cores as semantic aggregators using a "Map of Content" (Obsidian-style) philosophy.

## 1. Overview
In the Nodes project, **Cores** are the gravitational centers of the user's life visualization. Instead of being simple categories, they act as **MOCs (Maps of Content)** that aggregate **Nodes** based on shared **Connectors** (tags). A single Node can contribute to multiple Cores, creating a fluid, interconnected "Second Brain" for actions.

## 2. Architecture & Data Model

### 2.1 Supabase Schema Changes
We need to transition from a strict one-to-many relationship (`nodes.core_id`) to a many-to-many aggregation logic using Connectors as the bridge.

#### New Table: `core_connectors`
Links Cores to the Connectors they "subscribe" to.
```sql
CREATE TABLE IF NOT EXISTS core_connectors (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  core_id UUID REFERENCES cores(id) ON DELETE CASCADE NOT NULL,
  connector_id UUID REFERENCES connectors(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(core_id, connector_id)
);
```

#### Updated Table: `nodes` (Refinement)
We will keep `core_id` as an optional "Primary Core" for visual styling (e.g., node base color), but the functional membership for stability will be determined by the `core_connectors` map.

### 2.2 Logic Flow: Membership Auto-Assignment
1. **User Action:** User creates a Node and assigns it one or more **Connectors** (e.g., `#sport`, `#energy`).
2. **Core Discovery:** The system checks all **Cores** that have subscribed to these Connectors.
3. **MOC Mapping:** The Node is now considered part of these Cores.
4. **Graph Gravity:** In the `react-force-graph-2d` visualization, the Node will be pulled towards the centers of all its "parent" Cores.

## 3. Core Stability Calculation
Calculated by the Django logic engine (service role):
*   **Formula:** `Core_Stability = Average(Node_Stability_Score)` of all nodes mapped to the Core via connectors.
*   **Weighting (Optional):** We can weight nodes by their `mass` so that harder habits affect the Core's health more significantly.

## 4. UI/UX Components

### 4.1 Core Management (MOC Editor)
*   **Tag Selector:** A multi-select UI where users choose which Connectors this Core "captures".
*   **Live Preview:** As tags are added, the UI shows a list of "Affected Nodes".

### 4.2 Visual Representation
*   **Primary Core:** If a node belongs to multiple cores, its visual "accent color" is taken from its `primary_core_id` (or the first core in the list).
*   **Multi-Core Gravity:** Nodes belonging to multiple cores will naturally float between them on the graph, visually representing their cross-functional nature.

## 5. Implementation Steps
1.  **Migration:** Apply `core_connectors` table to Supabase.
2.  **Types:** Update TypeScript interfaces in `src/types/index.ts`.
3.  **Store:** Update `useNodesStore.ts` to include `core_connectors` state and actions.
4.  **UI:** Create a `CoreMocManager` component to link/unlink tags.
5.  **Analytics (Django):** Update the stability calculation service to use the new many-to-many mapping.
