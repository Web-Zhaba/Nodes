import type { Node, NodeType } from "@/types";

/**
 * Helper: Создание узла по умолчанию
 */
export function createDefaultNode(
  userId: string,
  name: string,
  nodeType: NodeType = "binary",
): Omit<Node, "id" | "created_at" | "updated_at"> {
  return {
    user_id: userId,
    name,
    description: "",
    node_type: nodeType,
    mass: 1.0,
    stability_score: 0,
    completion_count: 0,
    category: "default",
    frequency: "daily",
    color: "#6366f1",
    icon: "circle",
    position_x: undefined,
    position_y: undefined,
    core_id: undefined,
    target_value: nodeType === "binary" ? undefined : 10,
  };
}
