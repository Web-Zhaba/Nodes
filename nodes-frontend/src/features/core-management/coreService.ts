import { supabase } from "@/lib/supabase";
import type { Core, CoreConnector } from "@/types";

/**
 * Получить все Ядра пользователя
 */
export async function getUserCores(userId: string | undefined): Promise<Core[]> {
  if (!userId) return [];
  
  const { data, error } = await supabase
    .from("cores")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching cores:", error);
    return [];
  }

  return data || [];
}

/**
 * Создать новое Ядро
 */
export async function createCore(
  userId: string,
  name: string,
  color: string,
  icon: string = "Circle"
): Promise<Core | null> {
  const { data, error } = await supabase
    .from("cores")
    .insert({
      user_id: userId,
      name,
      color,
      icon,
    })
    .select("*")
    .single();

  if (error) {
    console.error("Error creating core:", error);
    return null;
  }

  return data;
}

/**
 * Обновить Ядро
 */
export async function updateCore(
  coreId: string,
  updates: Partial<Pick<Core, "name" | "color" | "icon">>
): Promise<Core | null> {
  const { data, error } = await supabase
    .from("cores")
    .update(updates)
    .eq("id", coreId)
    .select("*")
    .single();

  if (error) {
    console.error("Error updating core:", error);
    return null;
  }

  return data;
}

/**
 * Удалить Ядро
 */
export async function deleteCore(coreId: string): Promise<boolean> {
  const { error } = await supabase
    .from("cores")
    .delete()
    .eq("id", coreId);

  if (error) {
    console.error("Error deleting core:", error);
    return false;
  }

  return true;
}

/**
 * Получить все связи (core_connectors) для пользователя
 * (для MOC логики)
 */
export async function getUserCoreConnectors(): Promise<CoreConnector[]> {
  // Поскольку RLS разрешает пользователю видеть только свои связи,
  // мы можем просто запросить все
  const { data, error } = await supabase
    .from("core_connectors")
    .select("*");

  if (error) {
    console.error("Error fetching core connectors:", error);
    return [];
  }

  return data || [];
}

/**
 * Добавить или удалить связь Ядра и Коннектора
 */
export async function toggleCoreConnector(
  coreId: string, 
  connectorId: string, 
  isLinked: boolean
): Promise<{id: string} | null> {
  if (isLinked) {
    const { data, error } = await supabase
      .from("core_connectors")
      .insert({
        core_id: coreId,
        connector_id: connectorId
      })
      .select('id')
      .single();

    if (error) {
      console.error("Error adding core connector:", error);
      return null;
    }
    return data;
  } else {
    const { error } = await supabase
      .from("core_connectors")
      .delete()
      .match({ core_id: coreId, connector_id: connectorId });

    if (error) {
      console.error("Error removing core connector:", error);
      return null;
    }
    return { id: "removed" };
  }
}
