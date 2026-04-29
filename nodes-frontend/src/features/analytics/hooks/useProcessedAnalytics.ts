import { useMemo } from 'react';
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

export function useProcessedAnalytics() {
  const { rawStabilitySeries, rawHeatmap, selectedDays, focusEntity } = useAnalyticsStore();

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

    // Собираем массив для Recharts, предварительно отсортировав ключи
    const sortedDates = Array.from(dateMap.keys()).sort();
    
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

    if (focusEntity?.type === 'node' && rawStabilitySeries.length > 0) {
      // Группируем по дате только для выбранного узла
      const focusNodeId = focusEntity.id;
      const dateMap = new Map<string, { count: number; stability: number }>();
      for (const item of rawStabilitySeries) {
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
      sourceData = rawHeatmap || [];
    }

    const maxCount = sourceData.reduce((max, d) => Math.max(max, d.count), 0);

    return sourceData.map(d => ({
      date: d.date,
      count: d.count,
      level: computeLevel(d.count, maxCount),
      stability: d.stability,
    }));
  }, [rawHeatmap, rawStabilitySeries, focusEntity]);

  return { chartData, heatmapData };
}
