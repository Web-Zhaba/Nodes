import { supabase } from "@/lib/supabase";
import type { Node, Profile } from "@/types";

// =====================================================
// publicService — чтение публичных данных (без JWT)
// Работает через анонимный RLS policy
// =====================================================

export interface PublicProfile extends Pick<Profile, "id" | "display_name" | "created_at"> {
  public_slug: string;
  bio?: string;
}

export interface PublicNode extends Pick<
  Node,
  "id" | "name" | "description" | "node_type" | "mass" | "stability_score"
  | "color" | "icon" | "completion_count" | "created_at" | "share_token" | "user_id"
> {
  share_token: string;
  user_id: string;
  node_connectors?: { connector_id: string }[];
}

export interface PublicImpulse {
  id: string;
  node_id: string;
  value: number;
  completed_at: string;
  created_at: string;
}

export const publicService = {
  /**
   * Получить публичный профиль по slug
   */
  async getProfileBySlug(slug: string): Promise<PublicProfile | null> {
    const { data, error } = await supabase
      .from("profiles")
      .select("id, display_name, public_slug, bio, created_at")
      .eq("public_slug", slug)
      .eq("is_public", true)
      .single();

    if (error) return null;
    return data as PublicProfile;
  },

  /**
   * Получить публичные ядра пользователя
   */
  async getPublicCores(userId: string) {
    const { data, error } = await supabase
      .from("cores")
      .select("id, name, description, color, icon, stability_score, position_x, position_y")
      .eq("user_id", userId)
      .eq("is_public", true);

    if (error) return [];
    return data ?? [];
  },

  /**
   * Получить публичные узлы пользователя
   */
  async getPublicNodes(userId: string): Promise<PublicNode[]> {
    const { data, error } = await supabase
      .from("nodes")
      .select("id, name, description, node_type, mass, stability_score, color, icon, completion_count, created_at, share_token, node_connectors(connector_id)")
      .eq("user_id", userId)
      .eq("is_public", true)
      .order("name", { ascending: true });

    if (error) return [];
    return (data ?? []) as PublicNode[];
  },

  /**
   * Получить один публичный узел по share_token
   */
  async getNodeByToken(shareToken: string): Promise<PublicNode | null> {
    const { data, error } = await supabase
      .from("nodes")
      .select("id, name, description, node_type, mass, stability_score, color, icon, completion_count, created_at, share_token, user_id")
      .eq("share_token", shareToken)
      .eq("is_public", true)
      .single();

    if (error) return null;
    return data as PublicNode;
  },

  /**
   * Получить импульсы публичного узла (последние 90 дней)
   */
  async getPublicImpulses(nodeId: string): Promise<PublicImpulse[]> {
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
    ninetyDaysAgo.setHours(0, 0, 0, 0); // Начало дня

    const { data, error } = await supabase
      .from("impulses")
      .select("id, node_id, value, completed_at, created_at")
      .eq("node_id", nodeId)
      // Мы полагаемся на RLS политику, которая проверяет публичность узла
      .gte("completed_at", ninetyDaysAgo.toISOString().split("T")[0])
      .order("completed_at", { ascending: false });

    if (error) {
      console.error("Error fetching public impulses:", error);
      return [];
    }
    return (data ?? []) as PublicImpulse[];
  },

  /**
   * Обновить настройки публичности профиля
   */
  async updateProfilePrivacy(
    userId: string,
    updates: { is_public?: boolean; public_slug?: string; bio?: string }
  ): Promise<void> {
    const { error } = await supabase
      .from("profiles")
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq("id", userId);
    if (error) throw error;
  },

  /**
   * Обновить публичность узла
   */
  async updateNodePrivacy(
    nodeId: string,
    isPublic: boolean
  ): Promise<void> {
    const { error } = await supabase
      .from("nodes")
      .update({ is_public: isPublic, updated_at: new Date().toISOString() })
      .eq("id", nodeId);
    if (error) throw error;
  },

  /**
   * Обновить публичность ядра
   */
  async updateCorePrivacy(
    coreId: string,
    isPublic: boolean
  ): Promise<void> {
    const { error } = await supabase
      .from("cores")
      .update({ is_public: isPublic, updated_at: new Date().toISOString() })
      .eq("id", coreId);
    if (error) throw error;
  },

  /**
   * Проверить уникальность slug
   */
  async isSlugAvailable(slug: string): Promise<boolean> {
    const { count, error } = await supabase
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .eq("public_slug", slug);
    if (error) return false;
    return (count ?? 0) === 0;
  },

  /**
   * Получить коннекторы (теги) публичного пользователя
   */
  async getPublicConnectors(userId: string) {
    const { data, error } = await supabase
      .from("connectors")
      .select("*")
      .eq("user_id", userId);
    if (error) return [];
    return data ?? [];
  },

  /**
   * Получить связи ядер с коннекторами (для построения графа)
   */
  async getPublicCoreConnectors(coreIds: string[]) {
    if (coreIds.length === 0) return [];
    const { data, error } = await supabase
      .from("core_connectors")
      .select("*")
      .in("core_id", coreIds);
    if (error) return [];
    return data ?? [];
  },
};
