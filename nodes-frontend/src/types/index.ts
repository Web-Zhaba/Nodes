// =====================================================
// Nodes Tracker — Типы данных (v2)
// =====================================================

/**
 * NormalizedData — словарь для быстрого доступа по ID O(1)
 */
export type NormalizedData<T> = Record<string, T>;

/**
 * Тип узла определяет логику выполнения и расчёта стабильности
 * - binary: Да/Нет (фиксированный заряд)
 * - quantity: Количественный (пропорционален цели)
 * - duration: Длительность (накапливается через таймер)
 */
export type NodeType = "binary" | "quantity" | "duration";

/**
 * Node (Узел) — единица действия
 * Обладает массой (сложностью) и стабильностью (накопленный заряд)
 */
export interface Node {
  id: string;
  user_id: string;
  name: string;
  description?: string;

  // Устаревшие поля (для обратной совместимости)
  category: string;
  frequency: string;

  // Новые поля v2
  node_type: NodeType;
  mass: number; // Сложность узла (0.1 - 10)
  stability_score: number; // Накопленная стабильность (0-100)
  target_value?: number; // Цель для quantity/duration
  completion_count: number; // Счётчик полных выполнений узла

  // Визуальные параметры
  color?: string;
  icon?: string;

  // Позиция для графа
  position_x?: number;
  position_y?: number;

  // Связь с ядром
  core_id?: string;

  // Массив ID коннекторов (множественные связи)
  connector_ids?: string[];

  // Фокус по умолчанию
  is_focus_default: boolean;

  // Публичный доступ (Neural Public Sharing)
  is_public?: boolean;
  share_token?: string;

  // Метаданные
  created_at: string;
  updated_at: string;
}

/**
 * Core (Ядро) — гравитационный центр для группы узлов
 * Агрегирует стабильность связанных узлов
 */
export interface Core {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  color: string;
  icon?: string;
  stability_score: number; // Агрегированная стабильность (0-100)
  is_public?: boolean; // Публичный доступ
  position_x?: number;
  position_y?: number;
  created_at: string;
  updated_at: string;
}

/**
 * Connector (Коннектор) — семантическая связь (тег)
 * Группирует узлы по смыслу
 */
export interface Connector {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  color: string;
  is_mainline: boolean; // Флаг основного направления
  created_at: string;
  updated_at: string;
}

/**
 * Данные для создания узла
 */
export interface CreateNodeData {
  name: string;
  description?: string;
  node_type: NodeType;
  mass?: number;
  target_value?: number;
  is_focus_default?: boolean;
  color?: string;
  icon?: string;
  core_id?: string;
}

/**
 * CoreConnector — связь ядра с тегом (MOC mapping)
 */
export interface CoreConnector {
  id: string;
  core_id: string;
  connector_id: string;
  created_at: string;
}
/**
 * Profile (Профиль) — расширенные данные пользователя
 */
export interface Profile {
  id: string;
  email: string;
  display_name?: string;
  daily_reset_time: string; // Формат 'HH:mm'
  first_day_of_week: number; // 0 - Воскресенье, 1 - Понедельник
  language: string; // 'ru', 'en', etc.
  show_greeting: boolean;
  custom_greeting: string;
  theme_config?: any;

  onboarding_completed: boolean;

  // Neural Public Sharing
  is_public?: boolean;
  public_slug?: string;
  bio?: string;
  show_recommendations: boolean;

  // Subscription (migration 005)
  is_pro: boolean;
  pro_expires_at?: string | null;
  subscription_plan: 'free' | 'pro';

  created_at: string;
  updated_at: string;
}

/**
 * Impulse (Импульс) — отметка о выполнении узла
 */
export interface Impulse {
  id: string;
  user_id: string;
  node_id: string;
  value: number;
  completed_at: string; // YYYY-MM-DD
  created_at: string;
}

/**
 * Recommendation (Рекомендация) — обучающий контент на основе привычек
 */
export interface Recommendation {
  id: string;
  connectors?: Connector[];
  content_type: "video" | "book" | "course" | "article" | "product";
  title: string;
  description?: string;
  url: string;
  thumbnail_url?: string;
  source: string;
  score: number;
  affiliate_url?: string;
  is_viewed: boolean;
  is_saved: boolean;
  is_discarded: boolean;
  created_at: string;
}
