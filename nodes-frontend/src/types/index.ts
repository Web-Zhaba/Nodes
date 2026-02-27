// =====================================================
// Nodes Tracker — Типы данных (v2)
// =====================================================

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
  color?: string;
  icon?: string;
  core_id?: string;
}
