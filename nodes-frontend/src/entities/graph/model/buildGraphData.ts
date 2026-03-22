import type { NormalizedData, Node, Core, Connector, CoreConnector } from "@/types";
import type { GraphData, GraphNode, GraphLink } from "./types";

const DEFAULT_NODE_COLOR = "#8888aa";
const DEFAULT_CORE_COLOR = "#6c63ff";

/**
 * Превращает сырые данные из стора в формат, понятный движку react-force-graph-2d.
 *
 * Логика связей строится на коннекторах (тегах). Для каждого коннектора мы:
 * 1. Находим все узлы, к которым он прикреплен
 * 2. Связываем эти узлы между собой (чтобы они группировались)
 * 3. Тянем линии от этих узлов ко всем ядрам, которые втягивают в себя этот коннектор
 *
 * Если у узла нет коннектора или он уникален, узел просто будет плавать вдали от всех.
 */
export function buildGraphData(
  nodes: NormalizedData<Node>,
  cores: NormalizedData<Core>,
  connectors: NormalizedData<Connector>,
  coreConnectors: NormalizedData<CoreConnector>
): GraphData {
  const graphNodes: GraphNode[] = [];
  const graphLinks: GraphLink[] = [];

  // Сохраняем связи тут (формат: "id1--id2"), чтобы не рисовать две одинаковые линии поверх друг друга
  const linkSet = new Set<string>();

  // 1. Подготавливаем карту притяжения: id коннектора -> список подходящих ядер
  const connectorToCoreMap = new Map<string, string[]>();
  for (const cc of Object.values(coreConnectors)) {
    if (!connectorToCoreMap.has(cc.connector_id)) {
      connectorToCoreMap.set(cc.connector_id, []);
    }
    connectorToCoreMap.get(cc.connector_id)!.push(cc.core_id);
  }

  // 2. Группируем узлы по коннекторам: id коннектора -> список узлов
  const connectorToNodesMap = new Map<string, string[]>();
  for (const node of Object.values(nodes)) {
    for (const connectorId of node.connector_ids ?? []) {
      if (!connectorToNodesMap.has(connectorId)) {
        connectorToNodesMap.set(connectorId, []);
      }
      connectorToNodesMap.get(connectorId)!.push(node.id);
    }
  }

  // 3. Закидываем Ядра на полотно
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

  // 4. Докидываем обычные действия (узлы)
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

    // Страховка для старого функционала: если у узла напрямую захардкожено ядро, рисуем прямую связь
    if (node.core_id && cores[node.core_id]) {
      const key = [node.id, node.core_id].sort().join("--");
      if (!linkSet.has(key)) {
        linkSet.add(key);
        graphLinks.push({
          source: node.id,
          target: node.core_id,
          kind: "node-core",
          color: (cores[node.core_id].color || DEFAULT_CORE_COLOR) + "66",
        });
      }
    }
  }

  // 5. Выстраиваем гравитационные связи (нити) на основе коннекторов
  for (const [connectorId, nodeIds] of connectorToNodesMap.entries()) {
    const coreIds = connectorToCoreMap.get(connectorId) || [];
    const connector = connectors[connectorId];

    // Шаг А: связываем узлы друг с другом внутри одного коннектора
    for (let i = 0; i < nodeIds.length; i++) {
      for (let j = i + 1; j < nodeIds.length; j++) {
        const key = [nodeIds[i], nodeIds[j]].sort().join("--");
        if (!linkSet.has(key)) {
          linkSet.add(key);
          graphLinks.push({
            source: nodeIds[i],
            target: nodeIds[j],
            kind: "node-node",
            color: (connector?.color ?? DEFAULT_NODE_COLOR) + "44", 
          });
        }
      }
    }

    // Шаг Б: притягиваем этот ком из узлов к каждому из Ядер, собирающих этот коннектор
    for (const coreId of coreIds) {
      if (cores[coreId]) {
        const linkColor = cores[coreId].color ?? connector?.color ?? DEFAULT_NODE_COLOR;
        for (const nodeId of nodeIds) {
          const key = [nodeId, coreId].sort().join("--");
          if (!linkSet.has(key)) {
            linkSet.add(key);
            graphLinks.push({
              source: nodeId,
              target: coreId,
              kind: "node-core",
              color: linkColor + "66", // Слегка прозрачный цвет
            });
          }
        }
      }
    }
  }

  return { nodes: graphNodes, links: graphLinks };
}
