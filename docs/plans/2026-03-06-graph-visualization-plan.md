# Graph Visualization Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Integrate `react-force-graph-2d` into GraphPage, rendering Nodes and Cores as a live force-directed neural network with icons and labels.

**Architecture:** Pure `buildGraphData` selector transforms normalized React Query data into graph format. `iconCache.ts` converts Lucide SVG components to colored OffscreenCanvas for fast canvas rendering. `ForceGraph.tsx` wraps `react-force-graph-2d` with custom `nodeCanvasObject`.

**Tech Stack:** React 18, TypeScript, react-force-graph-2d, Lucide React, React Query (already installed), Zustand (already installed)

**Design Doc:** `docs/plans/2026-03-06-graph-visualization-design.md`

---

## Task 1: Install react-force-graph-2d

**Files:**
- Modify: `nodes-frontend/package.json` (via npm)

**Step 1: Install the package**

```bash
cd nodes-frontend
npm install react-force-graph-2d
```

Expected output: `added X packages` without errors.

**Step 2: Verify TypeScript types are available**

The package ships its own types. Check that no TS errors appear:

```bash
npx tsc --noEmit
```

Expected: no errors (or same errors as before install).

**Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "feat(graph): install react-force-graph-2d"
```

---

## Task 2: Define Graph Types

**Files:**
- Create: `nodes-frontend/src/entities/graph/model/types.ts`

**Step 1: Create the directory structure**

```bash
mkdir -p nodes-frontend/src/entities/graph/model
mkdir -p nodes-frontend/src/entities/graph/ui
```

**Step 2: Write the types file**

Create `nodes-frontend/src/entities/graph/model/types.ts`:

```typescript
/**
 * Types for the force-directed graph visualization.
 * These extend react-force-graph-2d's NodeObject/LinkObject
 * with our domain-specific fields.
 */

export interface GraphNode {
  /** Unique identifier (matches Node.id or Core.id) */
  id: string;
  /** Display name shown as label under the node */
  name: string;
  /** Lucide icon name (e.g. "Brain", "Dumbbell") */
  icon: string;
  /** Hex color: core's own color, or linked core's color for nodes */
  color: string;
  /** Distinguishes core nodes (large) from regular nodes (small) */
  nodeKind: 'core' | 'node';
  /**
   * Controls node radius in D3:
   * - core: 20
   * - node: 4 + mass * 1.5 (range ~4–19)
   */
  val: number;
  /** Stability score 0–100, reserved for future visual effects */
  stability: number;
  // D3 simulation adds x, y at runtime — no need to declare them
}

export interface GraphLink {
  /** ID of source node */
  source: string;
  /** ID of target node */
  target: string;
  /**
   * node-core: thicker, core color at 40% opacity
   * node-node: thinner, muted color at 27% opacity
   */
  kind: 'node-core' | 'node-node';
  /** Resolved hex color with opacity suffix */
  color: string;
}

export interface GraphData {
  nodes: GraphNode[];
  links: GraphLink[];
}
```

**Step 3: Verify with TypeScript**

```bash
cd nodes-frontend && npx tsc --noEmit
```

Expected: no new errors.

**Step 4: Commit**

```bash
git add nodes-frontend/src/entities/graph/
git commit -m "feat(graph): add GraphNode and GraphLink types"
```

---

## Task 3: Build the `buildGraphData` Selector

**Files:**
- Create: `nodes-frontend/src/entities/graph/model/buildGraphData.ts`

**Context:** This is a pure function — no React, no side effects. It takes the normalized data dictionaries from React Query and returns `{ nodes[], links[] }` for the graph.

**Step 1: Create the file**

Create `nodes-frontend/src/entities/graph/model/buildGraphData.ts`:

```typescript
import type { NormalizedData, Node, Core, Connector, CoreConnector } from "@/types";
import type { GraphData, GraphNode, GraphLink } from "./types";

const DEFAULT_NODE_COLOR = "#8888aa";
const DEFAULT_CORE_COLOR = "#6c63ff";

/**
 * Transforms normalized store data into react-force-graph-2d format.
 *
 * Link logic (connector-based communities):
 * For EACH connector:
 *   1. Find all nodes that share this connector
 *   2. Link each pair of those nodes to each other (node-node)
 *   3. If this connector is attached to a core, link each node to that core (node-core)
 *
 * Nodes with no connectors (or connectors shared with nobody) appear
 * as isolated floating nodes.
 */
export function buildGraphData(
  nodes: NormalizedData<Node>,
  cores: NormalizedData<Core>,
  connectors: NormalizedData<Connector>,
  coreConnectors: NormalizedData<CoreConnector>
): GraphData {
  const graphNodes: GraphNode[] = [];
  const graphLinks: GraphLink[] = [];

  // Track unique links to avoid duplicates: "id1--id2"
  const linkSet = new Set<string>();

  // --- 1. Build a lookup: connectorId → coreId (if any) ---
  const connectorToCoreMap = new Map<string, string>();
  for (const cc of Object.values(coreConnectors)) {
    connectorToCoreMap.set(cc.connector_id, cc.core_id);
  }

  // --- 2. Build a lookup: connectorId → list of node IDs ---
  const connectorToNodesMap = new Map<string, string[]>();
  for (const node of Object.values(nodes)) {
    for (const connectorId of (node.connector_ids ?? [])) {
      if (!connectorToNodesMap.has(connectorId)) {
        connectorToNodesMap.set(connectorId, []);
      }
      connectorToNodesMap.get(connectorId)!.push(node.id);
    }
  }

  // --- 3. Determine the "primary" color for each node ---
  // A node's color = first linked core's color, else DEFAULT_NODE_COLOR
  const nodeColorMap = new Map<string, string>();
  for (const [connectorId, nodeIds] of connectorToNodesMap.entries()) {
    const coreId = connectorToCoreMap.get(connectorId);
    if (coreId && cores[coreId]) {
      const coreColor = cores[coreId].color || DEFAULT_CORE_COLOR;
      for (const nodeId of nodeIds) {
        // Only set if not already assigned (first core wins)
        if (!nodeColorMap.has(nodeId)) {
          nodeColorMap.set(nodeId, coreColor);
        }
      }
    }
  }

  // --- 4. Add CORE graph nodes ---
  for (const core of Object.values(cores)) {
    graphNodes.push({
      id: core.id,
      name: core.name,
      icon: core.icon || "Circle",
      color: core.color || DEFAULT_CORE_COLOR,
      nodeKind: "core",
      val: 20,
      stability: core.stability_score ?? 0,
    });
  }

  // --- 5. Add NODE graph nodes ---
  for (const node of Object.values(nodes)) {
    const color = nodeColorMap.get(node.id) ?? DEFAULT_NODE_COLOR;
    graphNodes.push({
      id: node.id,
      name: node.name,
      icon: node.icon || "Circle",
      color,
      nodeKind: "node",
      val: 4 + (node.mass ?? 1) * 1.5,
      stability: node.stability_score ?? 0,
    });
  }

  // --- 6. Build LINKS from connector communities ---
  for (const [connectorId, nodeIds] of connectorToNodesMap.entries()) {
    const coreId = connectorToCoreMap.get(connectorId);
    const connector = connectors[connectorId];
    const core = coreId ? cores[coreId] : undefined;
    const linkColor = core?.color ?? connector?.color ?? DEFAULT_NODE_COLOR;

    // node-node links: connect every pair of nodes in this community
    for (let i = 0; i < nodeIds.length; i++) {
      for (let j = i + 1; j < nodeIds.length; j++) {
        const key = [nodeIds[i], nodeIds[j]].sort().join("--");
        if (!linkSet.has(key)) {
          linkSet.add(key);
          graphLinks.push({
            source: nodeIds[i],
            target: nodeIds[j],
            kind: "node-node",
            color: linkColor + "44", // ~27% opacity
          });
        }
      }
    }

    // node-core links: connect each node to the core (if exists)
    if (coreId && cores[coreId]) {
      for (const nodeId of nodeIds) {
        const key = [nodeId, coreId].sort().join("--");
        if (!linkSet.has(key)) {
          linkSet.add(key);
          graphLinks.push({
            source: nodeId,
            target: coreId,
            kind: "node-core",
            color: linkColor + "66", // ~40% opacity
          });
        }
      }
    }
  }

  return { nodes: graphNodes, links: graphLinks };
}
```

**Step 2: Verify with TypeScript**

```bash
cd nodes-frontend && npx tsc --noEmit
```

Expected: no new errors.

**Step 3: Commit**

```bash
git add nodes-frontend/src/entities/graph/model/buildGraphData.ts
git commit -m "feat(graph): add buildGraphData pure selector"
```

---

## Task 4: Create Icon Cache (SVG → OffscreenCanvas)

**Files:**
- Create: `nodes-frontend/src/features/graph-visualization/lib/iconCache.ts`
- Create: `nodes-frontend/src/features/graph-visualization/` (directory)

**Context:** Lucide exports React components. To draw them on Canvas, we render each icon as an SVG string → `data:image/svg+xml` URL → `Image` → `OffscreenCanvas`. The result is cached by `"iconName::color::size"` key for 60fps performance.

**Step 1: Create directory**

```bash
mkdir -p nodes-frontend/src/features/graph-visualization/lib
mkdir -p nodes-frontend/src/features/graph-visualization/hooks
```

**Step 2: Create the icon cache**

Create `nodes-frontend/src/features/graph-visualization/lib/iconCache.ts`:

```typescript
import { renderToStaticMarkup } from "react-dom/server";
import { createElement } from "react";
import { Icons } from "@/lib/icons";

/**
 * Cache: "iconName::color::size" → OffscreenCanvas
 *
 * Each OffscreenCanvas contains a pre-rendered, colored Lucide icon
 * ready to be drawn via ctx.drawImage() in nodeCanvasObject.
 */
const cache = new Map<string, OffscreenCanvas>();

/**
 * Synchronously returns a cached OffscreenCanvas for a Lucide icon.
 *
 * The first call for a given key triggers async rendering and returns null.
 * On the next render frame the cached canvas will be available.
 * This prevents blocking the animation loop.
 *
 * @param iconName - Key from Icons dictionary (e.g. "Brain")
 * @param color    - Hex color string (e.g. "#6c63ff")
 * @param size     - Canvas size in pixels (e.g. 14)
 */
export function getIconCanvas(
  iconName: string,
  color: string,
  size: number
): OffscreenCanvas | null {
  const key = `${iconName}::${color}::${size}`;

  if (cache.has(key)) {
    return cache.get(key)!;
  }

  // Trigger async render — result will be cached for next frame
  renderIconToCache(key, iconName, color, size);

  return null; // Not yet ready — caller should skip drawing this frame
}

async function renderIconToCache(
  key: string,
  iconName: string,
  color: string,
  size: number
): Promise<void> {
  // Guard: don't double-render the same key
  if (cache.has(key)) return;

  const IconComponent = Icons[iconName] || Icons["Circle"];

  // 1. Render Lucide React component to SVG string
  const svgString = renderToStaticMarkup(
    createElement(IconComponent, {
      color,
      width: size,
      height: size,
      strokeWidth: 1.5,
    })
  );

  // 2. Create data URI
  const dataUri = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgString)}`;

  // 3. Load as Image
  const img = new Image(size, size);
  img.src = dataUri;

  await new Promise<void>((resolve, reject) => {
    img.onload = () => resolve();
    img.onerror = reject;
  });

  // 4. Draw onto OffscreenCanvas
  const canvas = new OffscreenCanvas(size, size);
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  ctx.drawImage(img, 0, 0, size, size);

  // 5. Store in cache
  cache.set(key, canvas);
}

/**
 * Clears all cached icons. Call on unmount to free memory.
 */
export function clearIconCache(): void {
  cache.clear();
}
```

**Step 3: Verify with TypeScript**

```bash
cd nodes-frontend && npx tsc --noEmit
```

Expected: no new errors. Note: `renderToStaticMarkup` is in `react-dom/server` which is already a dependency.

**Step 4: Commit**

```bash
git add nodes-frontend/src/features/graph-visualization/
git commit -m "feat(graph): add OffscreenCanvas icon cache"
```

---

## Task 5: Create `useGraphData` Hook

**Files:**
- Create: `nodes-frontend/src/features/graph-visualization/hooks/useGraphData.ts`

**Context:** Composes the four existing React Query hooks and passes their data to `buildGraphData`.

**Step 1: Create the hook**

Create `nodes-frontend/src/features/graph-visualization/hooks/useGraphData.ts`:

```typescript
import { useMemo } from "react";
import { useNodesQuery } from "@/features/nodes/hooks/useNodesQuery";
import { useCoresQuery, useCoreConnectorsQuery } from "@/features/core-management/hooks/useCoresQuery";
import { useConnectorsQuery } from "@/features/connectors/hooks/useConnectorsQuery";
import { buildGraphData } from "@/entities/graph/model/buildGraphData";
import type { GraphData } from "@/entities/graph/model/types";

interface UseGraphDataResult {
  graphData: GraphData;
  isLoading: boolean;
}

/**
 * Composes React Query data sources and builds graph-ready data.
 * Memoized: only recomputes when underlying data changes.
 */
export function useGraphData(userId: string | undefined): UseGraphDataResult {
  const { data: nodes = {}, isLoading: isNodesLoading } = useNodesQuery(userId);
  const { data: cores = {}, isLoading: isCoresLoading } = useCoresQuery(userId);
  const { data: connectors = {}, isLoading: isConnectorsLoading } = useConnectorsQuery(userId);
  const { data: coreConnectors = {}, isLoading: isCoreConnectorsLoading } = useCoreConnectorsQuery(userId);

  const isLoading = isNodesLoading || isCoresLoading || isConnectorsLoading || isCoreConnectorsLoading;

  const graphData = useMemo(
    () => buildGraphData(nodes, cores, connectors, coreConnectors),
    [nodes, cores, connectors, coreConnectors]
  );

  return { graphData, isLoading };
}
```

**Step 2: Verify with TypeScript**

```bash
cd nodes-frontend && npx tsc --noEmit
```

**Step 3: Commit**

```bash
git add nodes-frontend/src/features/graph-visualization/hooks/useGraphData.ts
git commit -m "feat(graph): add useGraphData hook"
```

---

## Task 6: Create `ForceGraph.tsx` Component

**Files:**
- Create: `nodes-frontend/src/entities/graph/ui/ForceGraph.tsx`

**Context:** This is the main canvas component. It:
1. Measures container size via `ResizeObserver`
2. Renders `<ForceGraph2D>` with custom `nodeCanvasObject`
3. Draws icon + label for each node using `getIconCanvas`

**Step 1: Create the component**

Create `nodes-frontend/src/entities/graph/ui/ForceGraph.tsx`:

```typescript
import { useRef, useState, useEffect, useCallback } from "react";
import ForceGraph2D, { type ForceGraphMethods, type NodeObject } from "react-force-graph-2d";
import { getIconCanvas, clearIconCache } from "@/features/graph-visualization/lib/iconCache";
import type { GraphData, GraphNode } from "../model/types";

interface ForceGraphProps {
  graphData: GraphData;
  /** Background color — should match the page background */
  backgroundColor?: string;
}

const CORE_RADIUS = 18;
const LABEL_FONT_SIZE = 5;      // px in graph-space (scales with zoom)
const LABEL_OFFSET_EXTRA = 4;   // px gap between circle edge and label

export function ForceGraph({ graphData, backgroundColor = "transparent" }: ForceGraphProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const graphRef = useRef<ForceGraphMethods | undefined>(undefined);
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });

  // --- Measure container and listen for resize ---
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setDimensions({
          width: entry.contentRect.width,
          height: entry.contentRect.height,
        });
      }
    });

    observer.observe(el);
    setDimensions({ width: el.clientWidth, height: el.clientHeight });

    return () => observer.disconnect();
  }, []);

  // --- Zoom to fit after data loads ---
  useEffect(() => {
    if (graphData.nodes.length > 0) {
      setTimeout(() => {
        graphRef.current?.zoomToFit(400, 80);
      }, 300);
    }
  }, [graphData]);

  // --- Cleanup icon cache on unmount ---
  useEffect(() => {
    return () => clearIconCache();
  }, []);

  // --- Custom node painter ---
  const paintNode = useCallback(
    (rawNode: NodeObject, ctx: CanvasRenderingContext2D, globalScale: number) => {
      const node = rawNode as GraphNode & { x: number; y: number };
      const { x, y, nodeKind, icon, color, name } = node;

      const isCore = nodeKind === "core";
      const radius = isCore ? CORE_RADIUS : Math.max(4, node.val ?? 4);
      const iconSize = isCore ? 14 : 10;

      // ---- 1. Circle fill ----
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, 2 * Math.PI);
      ctx.fillStyle = color + (isCore ? "33" : "22");
      ctx.fill();

      // ---- 2. Circle stroke ----
      ctx.strokeStyle = color;
      ctx.lineWidth = isCore ? 2.5 : 1.5;
      ctx.stroke();

      // ---- 3. Icon (OffscreenCanvas) ----
      const iconCanvas = getIconCanvas(icon, color, iconSize * 4); // 4x for sharpness
      if (iconCanvas) {
        const half = iconSize / 2;
        ctx.drawImage(iconCanvas, x - half, y - half, iconSize, iconSize);
      }

      // ---- 4. Label below ----
      const labelY = y + radius + LABEL_OFFSET_EXTRA;
      const fontSize = LABEL_FONT_SIZE / globalScale;
      ctx.font = isCore
        ? `bold ${fontSize}px Inter, sans-serif`
        : `${fontSize}px Inter, sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "top";
      ctx.fillStyle = isCore ? color : "rgba(255,255,255,0.75)";
      ctx.fillText(name, x, labelY);
    },
    []
  );

  // --- Link color resolver ---
  const getLinkColor = useCallback((link: object) => {
    return (link as { color: string }).color;
  }, []);

  // --- Link width ---
  const getLinkWidth = useCallback((link: object) => {
    return (link as { kind: string }).kind === "node-core" ? 1.2 : 0.8;
  }, []);

  return (
    <div ref={containerRef} className="w-full h-full">
      <ForceGraph2D
        ref={graphRef}
        graphData={graphData as never} // react-force-graph-2d is untyped here
        width={dimensions.width}
        height={dimensions.height}
        backgroundColor={backgroundColor}
        // Node rendering
        nodeCanvasObject={paintNode}
        nodeCanvasObjectMode={() => "replace"}
        nodeRelSize={4}
        nodeVal={(n) => (n as GraphNode).val}
        // Link rendering
        linkColor={getLinkColor}
        linkWidth={getLinkWidth}
        // D3 physics
        d3VelocityDecay={0.4}
        d3AlphaDecay={0.02}
        cooldownTicks={100}
        // Disable default labels (we draw our own)
        nodeLabel=""
      />
    </div>
  );
}
```

> **Note on `d3Force`:** link distance and charge are set via `d3Force` prop or `graphRef.current.d3Force(...)` inside a `useEffect`. If nodes cluster too tightly after testing, add:
> ```ts
> useEffect(() => {
>   graphRef.current?.d3Force("charge")?.strength(-120);
>   graphRef.current?.d3Force("link")?.distance(60);
> }, []);
> ```

**Step 2: Verify with TypeScript**

```bash
cd nodes-frontend && npx tsc --noEmit
```

**Step 3: Commit**

```bash
git add nodes-frontend/src/entities/graph/ui/ForceGraph.tsx
git commit -m "feat(graph): add ForceGraph canvas component"
```

---

## Task 7: Integrate into GraphPage

**Files:**
- Modify: `nodes-frontend/src/pages/GraphPage.tsx`

**Context:** Replace the placeholder `<div>` (grid + Sparkles icon) in the left panel with `<ForceGraph />`. The right panel (Cores management) stays 100% unchanged.

**Step 1: Edit GraphPage.tsx**

In `GraphPage.tsx`, make these changes:

1. **Add imports** at the top:
```typescript
import { ForceGraph } from "@/entities/graph/ui/ForceGraph";
import { useGraphData } from "@/features/graph-visualization/hooks/useGraphData";
```

2. **Add `useGraphData` hook** inside the component body (after existing queries):
```typescript
const { graphData } = useGraphData(user?.id);
```

3. **Replace the placeholder div** (the one with `flex-col items-center justify-center` containing Sparkles, h2, and p tags) with:
```typescript
<div className="flex-1 rounded-3xl overflow-hidden border border-primary/10">
  <ForceGraph graphData={graphData} />
</div>
```

The final left panel should just be the graph canvas — no text, no decorations.

**Step 2: Check for TypeScript errors**

```bash
cd nodes-frontend && npx tsc --noEmit
```

**Step 3: Start dev server and verify visually**

```bash
cd nodes-frontend && npm run dev
```

Open `http://localhost:5173/graph`. Expected:
- Cores appear as large labeled circles with icons
- Nodes appear as smaller circles orbiting their cores
- Links connect related nodes and nodes to cores
- Graph animates and then stabilizes
- Right panel (Cores list) still works normally

**Step 4: Commit**

```bash
git add nodes-frontend/src/pages/GraphPage.tsx
git commit -m "feat(graph): integrate ForceGraph into GraphPage"
```

---

## Task 8: Final QA Checks

**Step 1: Run full TypeScript check**

```bash
cd nodes-frontend && npx tsc --noEmit
```

Expected: 0 errors.

**Step 2: Build production bundle**

```bash
cd nodes-frontend && npm run build
```

Expected: successful build, bundle size increase from react-force-graph-2d (~200KB gzipped) acceptable.

**Step 3: Manual test scenarios**

- [ ] Graph loads without errors when user has no nodes/cores (empty state)
- [ ] Graph loads with 1 core and no nodes
- [ ] Graph loads with nodes but no cores (all nodes float freely)
- [ ] Graph loads with nodes connected to a core — links appear, nodes orbit core
- [ ] Graph loads with nodes sharing connectors — node-node links appear
- [ ] Zoom in/out works (scroll wheel)
- [ ] Pan works (click + drag canvas)
- [ ] Drag a node works (it moves, others adjust)
- [ ] Window resize: graph canvas fills the available space

**Step 4: Final commit**

```bash
git add -A
git commit -m "feat(graph): Phase 2 MVP complete — force-directed neural graph"
```

---

## Troubleshooting

### Icons not appearing
`getIconCanvas` returns `null` on first call (async render pending). This is expected — icons appear after 1-2 frames. If they never appear, check browser console for errors from `renderToStaticMarkup`.

### `renderToStaticMarkup` not found
It's in `react-dom/server`. In Vite + browser context, import from `react-dom/server.browser` if needed:
```typescript
import { renderToStaticMarkup } from "react-dom/server.browser";
```

### Nodes all pile up in center
Increase `charge` strength:
```typescript
graphRef.current?.d3Force("charge")?.strength(-200);
```

### Labels too small / too large
Adjust `LABEL_FONT_SIZE` constant in `ForceGraph.tsx`. Higher value = larger text.

### TypeScript errors on `ForceGraph2D` ref type
```typescript
import ForceGraph2D, { type ForceGraphMethods } from "react-force-graph-2d";
const graphRef = useRef<ForceGraphMethods | undefined>(undefined);
```
