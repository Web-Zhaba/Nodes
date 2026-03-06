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
  nodeKind: "core" | "node";
  /**
   * Controls node radius in D3:
   * - core: 20
   * - node: 4 + mass * 1.5 (range ~4–19)
   */
  val: number;
  /** Stability score 0–100, reserved for future visual effects */
  stability: number;
  // D3 simulation adds x, y at runtime — no need to declare them here
}

export interface GraphLink {
  /** ID of source node */
  source: string;
  /** ID of target node */
  target: string;
  /**
   * node-core: thicker line, core color at 40% opacity
   * node-node: thinner line, muted color at 27% opacity
   */
  kind: "node-core" | "node-node";
  /** Resolved hex color with opacity suffix appended */
  color: string;
}

export interface GraphData {
  nodes: GraphNode[];
  links: GraphLink[];
}
