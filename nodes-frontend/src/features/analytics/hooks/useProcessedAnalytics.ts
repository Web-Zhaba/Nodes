import { useMemo } from 'react';
import { useShallow } from 'zustand/shallow';
import { useAnalyticsStore } from '@/store/useAnalyticsStore';

/**
 * Строка для линейного графика: { date: "15.01", [nodeId]: stabilityScore, ... }
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

function computeLevel(count: number, maxCount: number): number {
  if (count === 0 || maxCount === 0) return 0;
  const ratio = count / maxCount;
  if (ratio <= 0.25) return 1;
  if (ratio <= 0.5) return 2;
  if (ratio <= 0.75) return 3;
  return 4;
}

/**
 * Агрегирует данные по неделям для уменьшения количества точек на графике.
 * Вместо 365 точек за год — 52 (одна в неделю, среднее за 7 дней).
 * Это критично для производительности Recharts.
 */
function aggregateByWeek(
  dateMap: Map<string, Record<string, number>>,
  sortedDates: string[]
): StabilityChartRow[] {
  if (sortedDates.length === 0) return [];

  const result: StabilityChartRow[] = [];
  let weekBucket: Record<string, number[]> = {};
  let weekDayCount = 0;

  const flush = (endDate: string) => {
    if (Object.keys(weekBucket).length > 0) {
      const [, m, d] = endDate.split('-');
      const row: StabilityChartRow = { date: `${d}.${m}` };
      for (const nodeId in weekBucket) {
        const vals = weekBucket[nodeId];
        row[nodeId] = parseFloat((vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(1));
      }
      result.push(row);
    }
    weekBucket = {};
    weekDayCount = 0;
  };

  for (const date of sortedDates) {
    const values = dateMap.get(date)!;
    for (const nodeId in values) {
      if (!weekBucket[nodeId]) weekBucket[nodeId] = [];
      weekBucket[nodeId].push(values[nodeId]);
    }
    weekDayCount++;
    if (weekDayCount >= 7) {
      flush(date);
    }
  }
  // Сбрасываем остаток последней неполной недели
  if (weekDayCount > 0 && sortedDates.length > 0) {
    flush(sortedDates[sortedDates.length - 1]);
  }

  return result;
}

export function useProcessedAnalytics() {
  // useShallow — оптимальный способ получить несколько полей из Zustand:
  // компонент ре-рендерится только если изменилось хотя бы одно из этих полей,
  // а не при любом изменении стора. При этом сохраняется ровно 1 хук-вызов.
  const {
    rawStabilitySeries,
    rawHeatmap,
    selectedDays,
    focusEntityId,
    focusEntityType,
  } = useAnalyticsStore(
    useShallow(s => ({
      rawStabilitySeries: s.rawStabilitySeries,
      rawHeatmap: s.rawHeatmap,
      selectedDays: s.selectedDays,
      // Берём только примитивы из focusEntity, а не весь объект.
      // Это предотвращает ложные инвалидации useMemo: если id/type не изменились,
      // мемо остаётся в кеше, даже если ссылка на объект focusEntity обновилась.
      focusEntityId: s.focusEntity?.id ?? null,
      focusEntityType: s.focusEntity?.type ?? null,
    }))
  );

  const chartData = useMemo(() => {
    if (!rawStabilitySeries || rawStabilitySeries.length === 0) return [];

    // Фильтруем данные по дате
    const limitDate = new Date();
    limitDate.setDate(limitDate.getDate() - selectedDays);
    const limitStr = limitDate.toISOString().split('T')[0];

    const filteredSeries = rawStabilitySeries.filter(s => s.date >= limitStr);

    // Группируем по дате
    const dateMap = new Map<string, Record<string, number>>();

    for (const item of filteredSeries) {
      if (!dateMap.has(item.date)) {
        dateMap.set(item.date, {});
      }
      const row = dateMap.get(item.date)!;
      row[item.node_id] = item.stability_score;
    }

    const sortedDates = Array.from(dateMap.keys()).sort();

    // Для годового вида (90+ дней) агрегируем по неделям:
    // 365 точек → 52 точки — нагрузка на Recharts снижается в ~7 раз
    if (selectedDays >= 90) {
      return aggregateByWeek(dateMap, sortedDates);
    }

    // Для коротких периодов — ежедневные данные
    const result: StabilityChartRow[] = [];
    for (const date of sortedDates) {
      const values = dateMap.get(date)!;
      const [, m, d] = date.split('-');
      result.push({
        date: `${d}.${m}`,
        ...values,
      });
    }

    return result;
  }, [rawStabilitySeries, selectedDays]);

  const heatmapData = useMemo(() => {
    let sourceData: { date: string; count: number; stability?: number }[];

    if (focusEntityType === 'node' && focusEntityId && rawStabilitySeries.length > 0) {
      // Группируем по дате только для выбранного узла
      const dateMap = new Map<string, { count: number; stability: number }>();
      for (const item of rawStabilitySeries) {
        if (item.node_id !== focusEntityId) continue;
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
      sourceData = rawHeatmap || [];
    }

    const maxCount = sourceData.reduce((max, d) => Math.max(max, d.count), 0);

    return sourceData.map(d => ({
      date: d.date,
      count: d.count,
      level: computeLevel(d.count, maxCount),
      stability: d.stability,
    }));
  }, [rawHeatmap, rawStabilitySeries, focusEntityId, focusEntityType]);

  return { chartData, heatmapData };
}
