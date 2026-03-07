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
 * as isolated floating nodes without any links.
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
    for (const connectorId of node.connector_ids ?? []) {
      if (!connectorToNodesMap.has(connectorId)) {
        connectorToNodesMap.set(connectorId, []);
      }
      connectorToNodesMap.get(connectorId)!.push(node.id);
    }
  }

  // --- 3. Removed: Nodes now use their own colors instead of inheriting from Cores ---

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
    const color = node.color || DEFAULT_NODE_COLOR;
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
