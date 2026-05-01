import { create } from 'zustand';
import {
  fetchAnalyticsHistory,
  type AnalyticsNodeInfo,
  type StabilitySeriesItem,
  type HeatmapItem,
} from '../lib/djangoApi';

export type FocusEntity = { type: 'node' | 'core'; id: string } | null;

interface AnalyticsState {
  // --- Фокус ---
  focusEntity: FocusEntity;
  setFocus: (entity: FocusEntity) => void;
  clearFocus: () => void;

  // --- Сырые данные с бэкенда ---
  nodes: AnalyticsNodeInfo[];
  rawStabilitySeries: StabilitySeriesItem[];
  rawHeatmap: HeatmapItem[];

  // --- Загрузка ---
  isLoading: boolean;
  error: string | null;

  // --- Состояние периода ---
  selectedDays: number;
  setSelectedDays: (days: number) => void;

  // --- Экшены ---
  fetchData: (days?: number) => Promise<void>;
}

export const useAnalyticsStore = create<AnalyticsState>((set) => ({
  // --- Фокус ---
  focusEntity: null,
  setFocus: (entity) => set({ focusEntity: entity }),
  clearFocus: () => set({ focusEntity: null }),

  // --- Данные ---
  nodes: [],
  rawStabilitySeries: [],
  rawHeatmap: [],

  // --- Загрузка ---
  isLoading: false,
  error: null,

  // --- Состояние периода ---
  selectedDays: 30, // По умолчанию за месяц
  setSelectedDays: (days: number) => set({ selectedDays: days }),

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

    set({
      nodes,
      rawStabilitySeries: stability_series,
      rawHeatmap: heatmap,
      isLoading: false,
      error: null,
    });
  },
}));

