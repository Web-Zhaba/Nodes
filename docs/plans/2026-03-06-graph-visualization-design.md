# Design: Graph Visualization (react-force-graph-2d)
**Date:** 2026-03-06  
**Phase:** 2 — Graph Visualization (MVP)  
**Status:** Approved

---

## Goal

Replace the placeholder on `GraphPage.tsx` with a live, interactive **force-directed graph** that renders Nodes and Cores as a gravitational neural network.

## Scope (This Session)

**In scope:**
- Install and integrate `react-force-graph-2d`
- Transform existing React Query data into graph format
- Custom canvas rendering: icon + label per node/core
- D3-force physics config (charge, link distance, decay)

**Out of scope:**
- Drag & Drop with position persistence
- Click-to-detail interactions
- Stability visual effects (glow, pulse)

---

## Section 1: Graph Data Model

### Types

```ts
// src/entities/graph/model/types.ts

interface GraphNode {
  id: string;
  name: string;
  icon: string;         // Lucide icon name
  color: string;        // Core color (for nodes) or own color (for cores)
  nodeKind: 'core' | 'node';
  val: number;          // Node size: core=20, node = mass * 1.5 + 4
  stability: number;    // 0-100, reserved for future effects
}

interface GraphLink {
  source: string;
  target: string;
  kind: 'node-core' | 'node-node';
  color: string;        // Core color with opacity
}
```

### Link Building Algorithm

For **each connector**:
1. Find all nodes that have this `connector_id` in their `connector_ids`
2. **Node ↔ Node:** Create a link for each pair of those nodes
3. **Node → Core:** If this connector is attached to a Core (via `coreConnectors`), link each of those nodes to that Core
4. Deduplicate links via `Set<string>` with key `"${sourceId}--${targetId}"`

Nodes without any connectors (or connectors not attached to any core/other nodes) appear as isolated, floating nodes with no links.

---

## Section 2: Component Structure (FSD)

```
src/
├── entities/
│   └── graph/
│       ├── model/
│       │   ├── types.ts           # GraphNode, GraphLink interfaces
│       │   └── buildGraphData.ts  # Pure selector: store data → {nodes, links}
│       └── ui/
│           └── ForceGraph.tsx     # Wrapper over react-force-graph-2d
│
├── features/
│   └── graph-visualization/
│       ├── hooks/
│       │   └── useGraphData.ts    # Combines React Query hooks → buildGraphData
│       └── lib/
│           └── iconCache.ts       # OffscreenCanvas icon cache (SVG → pixel)
│
└── pages/
    └── GraphPage.tsx              # Replace placeholder with <ForceGraph />
```

### File Responsibilities

| File | Purpose |
|---|---|
| `buildGraphData.ts` | Pure function, no side effects. Input: normalized store data. Output: `{ nodes[], links[] }` |
| `iconCache.ts` | `Map<string, OffscreenCanvas>` cache. Key: `"IconName::color"`. Converts Lucide SVG to colored OffscreenCanvas |
| `useGraphData.ts` | Composes existing React Query hooks, calls `buildGraphData`, returns `{ graphData, isLoading }` |
| `ForceGraph.tsx` | Renders `<ForceGraph2D>`, implements `nodeCanvasObject` with icon/label, handles ResizeObserver for canvas sizing |
| `GraphPage.tsx` | Swaps placeholder div for `<ForceGraph />`. Right panel (Cores list) stays unchanged |

---

## Section 3: Canvas Rendering Details

### Visual Language

#### CORE node (radius = 18px)
1. **Circle fill:** `core.color + "33"` (20% opacity background)
2. **Circle stroke:** `core.color`, lineWidth = 2.5
3. **Icon:** OffscreenCanvas, centered, size = 14×14px, color = `core.color`
4. **Label (below):** `ctx.fillText(name)`, bold, color = `core.color`, offset = radius + 4px

#### NODE node (radius = 4 + mass × 1.5)
1. **Circle fill:** `linkedCoreColor + "22"` (13% opacity) or `#ffffff11` if no core
2. **Circle stroke:** `linkedCoreColor` or `#ffffff44`, lineWidth = 1.5
3. **Icon:** OffscreenCanvas, centered, size = 10×10px, color = linkedCoreColor or `#8888aa`
4. **Label (below):** `ctx.fillText(name)`, regular weight, color = foreground CSS var, offset = radius + 4px

### Link Rendering

| Link type | Color | Width |
|---|---|---|
| `node-node` | connector color `+ "44"` or `#ffffff22` | 0.8 |
| `node-core` | core color `+ "66"` | 1.2 |

### D3-Force Physics Config

```ts
d3VelocityDecay={0.4}      // Inertia / smoothness
d3AlphaDecay={0.02}         // Simulation stabilization speed
linkDistance={60}            // Base node→core link length
charge={-120}               // Repulsion (prevents node overlap)
cooldownTicks={100}          // Stop animation after stabilization
```

---

## Icon Rendering: Approach B (SVG → OffscreenCanvas)

**Why:** Lucide icons are SVG React components. Canvas API needs pixel data. OffscreenCanvas allows drawing SVG as an image with any color, and caching the result for 60fps performance.

**Algorithm per icon:**
1. Get SVG string from Lucide via `renderToStaticMarkup(<IconComponent color={color} />)` (or manual SVG template)
2. Create `new OffscreenCanvas(size, size)`
3. Draw SVG string as `Image` with `data:image/svg+xml` URL
4. Cache in `Map` with key `"${iconName}::${color}::${size}"`
5. In `nodeCanvasObject`: call `ctx.drawImage(cached, x - size/2, y - size/2, size, size)`

---

## Approved Design Summary

- **Data:** `buildGraphData` pure selector with connector-based link logic
- **Rendering:** Custom `nodeCanvasObject` with 4-layer canvas drawing
- **Icons:** OffscreenCanvas cache, colored per core
- **Physics:** D3-force with tuned charge/decay for neural-net feel
- **Layout:** Left panel = ForceGraph (flex-1), Right panel = Cores list (unchanged)
