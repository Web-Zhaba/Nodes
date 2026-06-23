/**
 * Copyright (c) 2026 Web-Zhaba. All rights reserved.
 * Refactored to Local-First Offline Analytics Service
 */

import { z } from "zod";
import { useLocalDatabase } from "@/store/useLocalDatabase";
import type { Impulse } from "@/types";

const BASE_PULSE_BUMP = 20.0;
const MAX_OVERDRIVE_MULTIPLIER = 1.5;
const DECAY_RATE_PER_DAY = 0.05;
const MAX_STABILITY = 100.0;

function calculatePulseImpact(value: number, targetValue?: number | null): number {
  if (!targetValue || targetValue <= 0) {
    return BASE_PULSE_BUMP;
  }
  let completionRatio = value / targetValue;
  if (completionRatio > MAX_OVERDRIVE_MULTIPLIER) {
    completionRatio = MAX_OVERDRIVE_MULTIPLIER;
  }
  return BASE_PULSE_BUMP * completionRatio;
}

export const AnalyticsNodeInfoSchema = z.object({
  id: z.string(),
  name: z.string(),
  color: z.string().nullable(),
});
export type AnalyticsNodeInfo = z.infer<typeof AnalyticsNodeInfoSchema>;

export const StabilitySeriesItemSchema = z.object({
  date: z.string(),
  node_id: z.string(),
  stability_score: z.number(),
  pulse_count: z.number(),
});
export type StabilitySeriesItem = z.infer<typeof StabilitySeriesItemSchema>;

export const HeatmapItemSchema = z.object({
  date: z.string(),
  count: z.number(),
});
export type HeatmapItem = z.infer<typeof HeatmapItemSchema>;

export const AnalyticsHistoryResponseSchema = z.object({
  status: z.string(),
  nodes: z.array(AnalyticsNodeInfoSchema),
  stability_series: z.array(StabilitySeriesItemSchema),
  heatmap: z.array(HeatmapItemSchema),
});
export type AnalyticsHistoryResponse = z.infer<typeof AnalyticsHistoryResponseSchema>;

export async function fetchAnalyticsHistory(
  days = 365
): Promise<{ success: boolean; data?: AnalyticsHistoryResponse; error?: string }> {
  try {
    const db = useLocalDatabase.getState();
    const localNodes = db.nodes;
    const localImpulses = db.impulses;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const startDate = new Date(today);
    startDate.setDate(startDate.getDate() - days);

    // 1. Build nodes list
    const nodes: AnalyticsNodeInfo[] = localNodes.map((n) => ({
      id: n.id,
      name: n.name,
      color: n.color || "#3b82f6",
    }));

    // 2. Generate daily stability series per node using simulation
    const stability_series: StabilitySeriesItem[] = [];

    for (const node of localNodes) {
      const nodeImpulses = localImpulses.filter((imp) => imp.node_id === node.id);
      
      const impulsesMap = new Map<string, Impulse[]>();
      for (const imp of nodeImpulses) {
        impulsesMap.set(imp.completed_at, [...(impulsesMap.get(imp.completed_at) || []), imp]);
      }

      const nodeCreatedDate = new Date(node.created_at);
      nodeCreatedDate.setHours(0, 0, 0, 0);

      const simulationStartDate = new Date(startDate);
      simulationStartDate.setDate(simulationStartDate.getDate() - 30);

      const startSim = simulationStartDate < nodeCreatedDate ? nodeCreatedDate : simulationStartDate;
      const tempDate = new Date(startSim);
      let currentStability = 0.0;

      while (tempDate <= today) {
        const dateStr = tempDate.toISOString().split("T")[0];

        // Decay stability daily
        if (tempDate.getTime() !== startSim.getTime()) {
          currentStability *= 1 - DECAY_RATE_PER_DAY;
        }

        // Apply impulse increases
        const dayImpulses = impulsesMap.get(dateStr) || [];
        let pulseCount = 0;

        if (dayImpulses.length > 0) {
          const totalValue = dayImpulses.reduce((sum, imp) => sum + Number(imp.value), 0);
          const impact = calculatePulseImpact(totalValue, node.target_value);
          currentStability += impact;
          if (currentStability > MAX_STABILITY) {
            currentStability = MAX_STABILITY;
          }
          pulseCount = dayImpulses.length;
        }

        // Save entry if we are within the target range
        if (tempDate >= startDate) {
          stability_series.push({
            date: dateStr,
            node_id: node.id,
            stability_score: Math.round(currentStability * 100) / 100,
            pulse_count: pulseCount,
          });
        }

        tempDate.setDate(tempDate.getDate() + 1);
      }
    }

    // 3. Generate heatmap: total counts of impulses per day
    const heatmapMap = new Map<string, number>();
    const tempDate = new Date(startDate);

    // Initialize all dates in range with 0 count
    while (tempDate <= today) {
      const dateStr = tempDate.toISOString().split("T")[0];
      heatmapMap.set(dateStr, 0);
      tempDate.setDate(tempDate.getDate() + 1);
    }

    // Accumulate actual impulses counts
    for (const imp of localImpulses) {
      if (heatmapMap.has(imp.completed_at)) {
        heatmapMap.set(imp.completed_at, (heatmapMap.get(imp.completed_at) || 0) + 1);
      }
    }

    const heatmap: HeatmapItem[] = Array.from(heatmapMap.entries()).map(([date, count]) => ({
      date,
      count,
    }));

    return {
      success: true,
      data: {
        status: "ok",
        nodes,
        stability_series,
        heatmap,
      },
    };
  } catch (error: any) {
    console.error("Local analytics calculation failed:", error);
    return {
      success: false,
      error: error.message || "Unknown error calculating analytics history",
    };
  }
}
