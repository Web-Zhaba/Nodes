import { z } from 'zod';
import { getAuthToken, TIMEOUT_MS } from './stability';

const DJANGO_API_URL = import.meta.env.VITE_DJANGO_API_URL || 'http://127.0.0.1:8000/api/v1';

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
  debug: z.object({
    runtime_ms: z.number(),
  }).optional(),
});
export type AnalyticsHistoryResponse = z.infer<typeof AnalyticsHistoryResponseSchema>;

export async function fetchAnalyticsHistory(
  days = 365
): Promise<{ success: boolean; data?: AnalyticsHistoryResponse; error?: string }> {
  try {
    const token = await getAuthToken();
    if (!token) {
      return { success: false, error: 'No active session' };
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

    const response = await fetch(
      `${DJANGO_API_URL}/analytics/history?days=${days}`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        signal: controller.signal,
      }
    );

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errPayload = await response.json().catch(() => ({}));
      throw new Error(errPayload.message || `HTTP ${response.status}`);
    }

    const rawData = await response.json();
    const data = AnalyticsHistoryResponseSchema.parse(rawData);
    
    return { success: true, data };

  } catch (err: any) {
    if (err.name === 'AbortError') {
      console.warn('Analytics API: request timed out');
      return { success: false, error: 'timeout' };
    }
    // ZodError
    if (err.name === 'ZodError') {
      console.error('Analytics API Validation Error:', err.errors);
      return { success: false, error: 'Invalid data format from server' };
    }
    console.error('Analytics API Error:', err.message);
    return { success: false, error: err.message };
  }
}
