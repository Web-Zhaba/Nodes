import { supabase } from "@/lib/supabase";
import type { Connector } from "@/types";

/**
 * Сервис для работы с коннекторами
 */

/**
 * Получить все коннекторы пользователя
 */
export async function getUserConnectors(): Promise<Connector[]> {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return [];
    }

    const { data, error } = await supabase
      .from("connectors")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Ошибка получения коннекторов:", error);
      return [];
    }

    return data as Connector[];
  } catch (error) {
    console.error("Ошибка получения коннекторов:", error);
    return [];
  }
}

/**
 * Создать новый коннектор
 */
export async function createConnector(
  name: string,
  options?: {
    description?: string;
    color?: string;
    is_mainline?: boolean;
  },
): Promise<Connector | null> {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return null;
    }

    const connectorData = {
      user_id: user.id,
      name: name.replace(/^#/, ""), // Удаляем # если есть
      description: options?.description || "",
      color: options?.color || "#22c55e",
      is_mainline: options?.is_mainline || false,
    };

    const { data, error } = await supabase
      .from("connectors")
      .insert(connectorData)
      .select()
      .single();

    if (error) {
      console.error("Ошибка создания коннектора:", error);
      return null;
    }

    return data as Connector;
  } catch (error) {
    console.error("Ошибка создания коннектора:", error);
    return null;
  }
}
