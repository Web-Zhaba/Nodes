import type { Core } from "@/types";

/**
 * Helper: Создание ядра по умолчанию
 */
export function createDefaultCore(
  userId: string,
  name: string,
): Omit<Core, "id" | "created_at" | "updated_at"> {
  return {
    user_id: userId,
    name,
    description: "",
    color: "#6366f1",
    icon: "circle",
    stability_score: 0,
    position_x: undefined,
    position_y: undefined,
  };
}
