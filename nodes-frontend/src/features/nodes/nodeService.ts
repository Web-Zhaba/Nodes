import { supabase } from "@/lib/supabase";
import type { Node, CreateNodeData } from "@/types";

/**
 * Сервис для работы с узлами
 */

/**
 * Получить все узлы пользователя с коннекторами
 */
export async function getUserNodes(): Promise<Node[]> {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return [];
    }

    const { data, error } = await supabase
      .from("nodes")
      .select(
        `
        *,
        node_connectors (
          connector_id
        )
      `,
      )
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Ошибка получения узлов:", error);
      return [];
    }

    // Преобразуем данные: извлекаем connector_ids
    const nodes = data.map((node: any) => ({
      ...node,
      connector_ids:
        node.node_connectors?.map((nc: any) => nc.connector_id) || [],
    })) as Node[];

    return nodes;
  } catch (error) {
    console.error("Ошибка получения узлов:", error);
    return [];
  }
}

/**
 * Создать новый узел с коннекторами
 */
export async function createNode(
  nodeData: CreateNodeData & { connector_ids?: string[] },
): Promise<Node | null> {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return null;
    }

    const { connector_ids, ...nodeFields } = nodeData;

    const newNode = {
      user_id: user.id,
      name: nodeFields.name,
      description: nodeFields.description || "",
      node_type: nodeFields.node_type,
      mass: nodeFields.mass ?? 1.0,
      target_value: nodeFields.target_value,
      color: nodeFields.color || "#8b5cf6",
      icon: nodeFields.icon || "Circle",
      category: "default", // Для обратной совместимости
      frequency: "daily", // Для обратной совместимости
      stability_score: 0,
      core_id: nodeFields.core_id,
    };

    // Создаём узел
    const { data: node, error: nodeError } = await supabase
      .from("nodes")
      .insert(newNode)
      .select()
      .single();

    if (nodeError) {
      console.error("Ошибка создания узла:", nodeError);
      return null;
    }

    // Если есть коннекторы, создаём связи
    if (connector_ids && connector_ids.length > 0) {
      const nodeConnectorsData = connector_ids.map((connector_id) => ({
        node_id: node.id,
        connector_id,
      }));

      const { error: ncError } = await supabase
        .from("node_connectors")
        .insert(nodeConnectorsData);

      if (ncError) {
        console.error("Ошибка создания связей с коннекторами:", ncError);
        // Не возвращаем ошибку, узел уже создан
      }
    }

    // Возвращаем узел с connector_ids
    return {
      ...node,
      connector_ids: connector_ids || [],
    } as Node;
  } catch (error) {
    console.error("Ошибка создания узла:", error);
    return null;
  }
}

/**
 * Обновить узел
 */
export async function updateNode(
  id: string,
  updates: Partial<Node> & { connector_ids?: string[] },
): Promise<boolean> {
  try {
    const { connector_ids, ...nodeFields } = updates;

    // 1. Обновляем основные поля узла
    if (Object.keys(nodeFields).length > 0) {
      const { error: nodeError } = await supabase
        .from("nodes")
        .update(nodeFields)
        .eq("id", id);

      if (nodeError) {
        console.error("Ошибка обновления узла:", nodeError);
        return false;
      }
    }

    // 2. Обновляем коннекторы (если переданы)
    if (connector_ids !== undefined) {
      // Удаляем старые связи
      const { error: deleteError } = await supabase
        .from("node_connectors")
        .delete()
        .eq("node_id", id);

      if (deleteError) {
        console.error("Ошибка удаления старых связей коннекторов:", deleteError);
        return false;
      }

      // Добавляем новые связи
      if (connector_ids.length > 0) {
        const nodeConnectorsData = connector_ids.map((connector_id) => ({
          node_id: id,
          connector_id,
        }));

        const { error: insertError } = await supabase
          .from("node_connectors")
          .insert(nodeConnectorsData);

        if (insertError) {
          console.error("Ошибка добавления новых связей коннекторов:", insertError);
          return false;
        }
      }
    }

    return true;
  } catch (error) {
    console.error("Ошибка обновления узла:", error);
    return false;
  }
}

/**
 * Удалить узел
 */
export async function deleteNode(id: string): Promise<boolean> {
  try {
    const { error } = await supabase.from("nodes").delete().eq("id", id);

    if (error) {
      console.error("Ошибка удаления узла:", error);
      return false;
    }

    return true;
  } catch (error) {
    console.error("Ошибка удаления узла:", error);
    return false;
  }
}

/**
 * Получить узел по ID
 */
export async function getNodeById(id: string): Promise<Node | null> {
  try {
    const { data, error } = await supabase
      .from("nodes")
      .select(
        `
        *,
        node_connectors (
          connector_id
        )
      `,
      )
      .eq("id", id)
      .single();

    if (error || !data) {
      console.error("Ошибка получения узла:", error);
      return null;
    }

    // Преобразуем данные: извлекаем connector_ids
    return {
      ...(data as any),
      connector_ids:
        (data as any).node_connectors?.map((nc: any) => nc.connector_id) || [],
    } as Node;
  } catch (error) {
    console.error("Ошибка получения узла:", error);
    return null;
  }
}

/**
 * Создать импульс (отметка выполнения)
 */
export async function createImpulse(
  nodeId: string,
  value: number = 1,
  date: Date = new Date()
): Promise<boolean> {
  try {
    const dateStr = formatDateToSql(date);

    const { error } = await supabase.rpc("save_node_progress", {
      p_node_id: nodeId,
      p_value: value,
      p_date: dateStr,
      p_is_incremental: true
    });

    if (error) {
      console.error("Ошибка вызова save_node_progress:", error);
      return false;
    }

    return true;
  } catch (error) {
    console.error("Ошибка создания импульса:", error);
    return false;
  }
}

/**
 * Вспомогательная функция для форматирования даты в YYYY-MM-DD
 */
function formatDateToSql(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}


/**
 * Получить импульсы для списка узлов за определенную дату (Batch)
 */
export async function getImpulsesForDateBatch(nodeIds: string[], date: Date): Promise<any[]> {
  if (nodeIds.length === 0) return [];

  try {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const dateStr = `${year}-${month}-${day}`;

    const { data, error } = await supabase
      .from("impulses")
      .select("*")
      .in("node_id", nodeIds)
      .eq("completed_at", dateStr);

    if (error) {
      console.error("Ошибка получения батча импульсов:", error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error("Ошибка получения батча импульсов:", error);
    return [];
  }
}




/**
 * Обновить значение quantity узла за сегодня
 */
export async function updateQuantityValue(
  nodeId: string,
  value: number,
  date: Date = new Date()
): Promise<boolean> {
  try {
    const dateStr = formatDateToSql(date);

    const { error } = await supabase.rpc("save_node_progress", {
      p_node_id: nodeId,
      p_value: value,
      p_date: dateStr,
      p_is_incremental: false // Устанавливаем абсолютное значение
    });

    if (error) {
      console.error("Ошибка обновления значения quantity:", error);
      return false;
    }

    return true;
  } catch (error) {
    console.error("Ошибка обновления значения:", error);
    return false;
  }
}

/**
 * Получить ID узлов для фокуса на указанную дату
 */
export async function getDailyFocusNodeIds(date: Date): Promise<string[]> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const dateStr = `${year}-${month}-${day}`;

    const { data, error } = await supabase
      .from("daily_focus")
      .select("node_id")
      .eq("user_id", user.id)
      .eq("focus_date", dateStr);

    if (error) {
      console.error("Ошибка получения узлов фокуса:", error);
      return [];
    }

    return data.map((d: any) => d.node_id);
  } catch (error) {
    console.error("Ошибка получения узлов фокуса:", error);
    return [];
  }
}

/**
 * Установить узлы фокуса на указанную дату
 */
export async function setDailyFocusNodes(nodeIds: string[], date: Date): Promise<boolean> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const dateStr = `${year}-${month}-${day}`;

    // 1. Удаляем все для этой даты (чтобы синхронизировать)
    await supabase.from("daily_focus").delete().eq("user_id", user.id).eq("focus_date", dateStr);

    // 2. Добавляем запрошенные
    if (nodeIds.length > 0) {
      const rows = nodeIds.map(id => ({ user_id: user.id, node_id: id, focus_date: dateStr }));
      const { error } = await supabase.from("daily_focus").insert(rows);
      if (error) {
        console.error("Ошибка установки узлов фокуса:", error);
        return false;
      }
    }

    return true;
  } catch (error) {
    console.error("Ошибка установки узлов фокуса:", error);
    return false;
  }
}
