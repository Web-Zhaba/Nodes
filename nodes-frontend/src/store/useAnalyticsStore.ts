import { create } from 'zustand';
import {
  fetchAnalyticsHistory,
  type AnalyticsNodeInfo,
  type StabilitySeriesItem,
  type HeatmapItem,
} from '../lib/djangoApi';

// ===== Типы =====

type FocusEntity = { type: 'node' | 'core'; id: string } | null;

/**
 * Строка для линейного графика: { date: "2026-01-15", [nodeId]: pulseCount, ... }
 * Формат, который Recharts принимает напрямую как data[].
 */
export type StabilityChartRow = Record<string, string | number>;

/**
 * Данные для тепловой карты: { date, count, level }
 */
export interface HeatmapCell {
  date: string;
  count: number;
  level: number;  // 0-4
  stability?: number;
}

interface AnalyticsState {
  // --- Фокус ---
  focusEntity: FocusEntity;
  setFocus: (entity: FocusEntity) => void;
  clearFocus: () => void;

  // --- Сырые данные с бэкенда ---
  nodes: AnalyticsNodeInfo[];
  rawStabilitySeries: StabilitySeriesItem[];
  rawHeatmap: HeatmapItem[];

  // --- Вычисленные (derived) данные для графиков ---
  chartData: StabilityChartRow[];
  heatmapData: HeatmapCell[];

  // --- Загрузка ---
  isLoading: boolean;
  error: string | null;

  // --- Состояние периода ---
  selectedDays: number;

  // --- Экшены ---
  fetchData: (days?: number) => Promise<void>;
  setSelectedDays: (days: number) => void;
}

/**
 * Вычисляет уровень интенсивности (0–4) для тепловой карты
 * на основе максимального значения count в данных.
 */
function computeLevel(count: number, maxCount: number): number {
  if (count === 0 || maxCount === 0) return 0;
  const ratio = count / maxCount;
  if (ratio <= 0.25) return 1;
  if (ratio <= 0.5) return 2;
  if (ratio <= 0.75) return 3;
  return 4;
}

/**
 * Трансформирует сырые данные stability_series в формат Recharts.
 * 
 * Вход: [{date: "2026-01-01", node_id: "abc", pulse_count: 3}, ...]
 * Выход: [{date: "01.01", "abc": 3, "def": 1}, ...]
 */
function buildChartData(
  series: StabilitySeriesItem[],
  days: number = 30
): StabilityChartRow[] {
  // Фильтруем данные по дате
  const limitDate = new Date();
  limitDate.setDate(limitDate.getDate() - days);
  const limitStr = limitDate.toISOString().split('T')[0];

  const filteredSeries = series.filter(s => s.date >= limitStr);

  // Группируем по дате
  const dateMap = new Map<string, Record<string, number>>();

  for (const item of filteredSeries) {
    if (!dateMap.has(item.date)) {
      dateMap.set(item.date, {});
    }
    const row = dateMap.get(item.date)!;
    row[item.node_id] = item.stability_score;
  }

  // Собираем массив для Recharts, предварительно отсортировав ключи (даты ISO)
  const sortedDates = Array.from(dateMap.keys()).sort();
  
  const result: StabilityChartRow[] = [];
  for (const date of sortedDates) {
    const values = dateMap.get(date)!;
    // Формат даты для оси X: "15.01"
    const [y, m, d] = date.split('-');
    result.push({
      date: `${d}.${m}`,
      ...values,
    });
  }

  return result;
}

/**
 * Трансформирует сырые heatmap-данные в формат ContributionGraph.
 */
function buildHeatmapData(
  rawHeatmap: HeatmapItem[],
  focusSeries?: StabilitySeriesItem[],
  focusNodeId?: string
): HeatmapCell[] {
  let sourceData: { date: string; count: number; stability?: number }[];

  if (focusNodeId && focusSeries) {
    // Группируем по дате только для выбранного узла
    const dateMap = new Map<string, { count: number; stability: number }>();
    for (const item of focusSeries) {
      if (item.node_id !== focusNodeId) continue;
      dateMap.set(item.date, { 
        count: (item.pulse_count || 0), 
        stability: item.stability_score 
      });
    }
    sourceData = Array.from(dateMap, ([date, val]) => ({ 
      date, 
      count: val.count, 
      stability: val.stability 
    }));
  } else {
    sourceData = rawHeatmap;
  }

  const maxCount = sourceData.reduce((max, d) => Math.max(max, d.count), 0);

  return sourceData.map(d => ({
    date: d.date,
    count: d.count,
    level: computeLevel(d.count, maxCount),
    stability: d.stability,
  }));
}

export const useAnalyticsStore = create<AnalyticsState>((set, get) => ({
  // --- Фокус ---
  focusEntity: null,
  setFocus: (entity) => {
    set({ focusEntity: entity });
    const state = get();
    const focusNodeId = entity?.type === 'node' ? entity.id : undefined;
    set({
      chartData: buildChartData(state.rawStabilitySeries, state.selectedDays),
      heatmapData: buildHeatmapData(state.rawHeatmap, state.rawStabilitySeries, focusNodeId),
    });
  },
  clearFocus: () => {
    set({ focusEntity: null });
    const state = get();
    set({
      chartData: buildChartData(state.rawStabilitySeries, state.selectedDays),
      heatmapData: buildHeatmapData(state.rawHeatmap),
    });
  },

  // --- Данные ---
  nodes: [],
  rawStabilitySeries: [],
  rawHeatmap: [],
  chartData: [],
  heatmapData: [],

  // --- Загрузка ---
  isLoading: false,
  error: null,

  // --- Состояние периода ---
  selectedDays: 30, // По умолчанию за месяц

  // --- Fetch ---
  fetchData: async (days) => {
    // Мы всегда запрашиваем максимум (365), чтобы переключение было мгновенным
    // и чтобы тепловая карта всегда была полной.
    const targetDays = days || 365; 
    set({ isLoading: true, error: null });

    const result = await fetchAnalyticsHistory(targetDays);

    if (!result.success || !result.data) {
      set({
        isLoading: false,
        error: result.error || 'Не удалось загрузить данные аналитики',
      });
      return;
    }

    const { nodes, stability_series, heatmap } = result.data;
    const state = get();
    const focusNodeId = state.focusEntity?.type === 'node' ? state.focusEntity.id : undefined;

    set({
      nodes,
      rawStabilitySeries: stability_series,
      rawHeatmap: heatmap,
      chartData: buildChartData(stability_series, state.selectedDays),
      heatmapData: buildHeatmapData(heatmap, stability_series, focusNodeId),
      isLoading: false,
      error: null,
    });
  },

  setSelectedDays: (days: number) => {
    set({ selectedDays: days });
    const state = get();
    const focusNodeId = state.focusEntity?.type === 'node' ? state.focusEntity.id : undefined;
    set({
      chartData: buildChartData(state.rawStabilitySeries, days),
    });
  },
}));
