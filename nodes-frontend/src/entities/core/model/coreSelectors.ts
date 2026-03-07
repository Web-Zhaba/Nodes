import type { Node, CoreConnector, NormalizedData } from "@/types";

/**
 * Selector: Получение всех узлов, относящихся к Ядру
 * Принимает нормализованные данные узлов и связей ядер с коннекторами.
 */
export const getNodesForCore = (
  nodes: NormalizedData<Node>, 
  coreConnectors: NormalizedData<CoreConnector>, 
  coreId: string
) => {
  const coreTags = Object.values(coreConnectors)
    .filter((cc) => cc.core_id === coreId)
    .map((cc) => cc.connector_id);

  return Object.values(nodes).filter((node) =>
    node.connector_ids?.some((tagId) => coreTags.includes(tagId)),
  );
};
