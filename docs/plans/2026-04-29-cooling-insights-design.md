# Design Specification: Cooling Insights (Analytics Phase 3)

**Date:** 2026-04-29
**Status:** Approved / Pending Implementation
**Feature:** Analytics Insights for "Cooling" Nodes

## 1. Overview
The "Cooling Insights" system transforms raw stability data into actionable intelligence. It identifies nodes that are losing stability (cooling down) and presents this information to the user through a hybrid UI approach: a dedicated insights widget and visual markers on charts.

## 2. Backend Implementation (Django)

### 2.1 Detection Logic
The logic will be integrated into the `get_analytics_history` view pass for efficiency.

**Conditions for "Cooling" status:**
- **Stability Erosion:** `current_stability < 0.9 * max_stability_last_7_days`.
- **Pulse Inertia:** `days_since_last_pulse > 3`.
- **Slope Analysis:** The derivative of stability over the last 3 data points is negative.

### 2.2 API Schema Update
The response from `/api/v1/analytics/history` will now include an `insights` array.

```json
{
  "status": "success",
  "nodes": [...],
  "stability_series": [...],
  "heatmap": [...],
  "insights": [
    {
      "node_id": "uuid",
      "type": "cooling",
      "severity": "low | medium | high",
      "message": "Node 'Reading' is cooling down. Lost 12% stability.",
      "days_since_pulse": 4,
      "trend_value": -12.5
    }
  ],
  "debug": { "runtime_ms": 12.5 }
}
```

## 3. Frontend Implementation (React + Zustand)

### 3.1 Data Validation (Zod)
Update `src/lib/djangoApi.ts` with the new schema:
```typescript
export const InsightSchema = z.object({
  node_id: z.string(),
  type: z.literal('cooling'),
  severity: z.enum(['low', 'medium', 'high']),
  message: z.string(),
  days_since_pulse: z.number(),
  trend_value: z.number()
});

// Update AnalyticsHistoryResponseSchema to include array of InsightSchema
```

### 3.2 UI Components

#### A. `InsightCards.tsx` (New Component)
- **Location:** Top of Analytics Page, above the main chart.
- **Visuals:** 
  - Horizontal scrolling list of glassmorphism cards.
  - Color accents based on severity: 
    - `low`: Subtle cyan glow.
    - `medium`: Bright cyan + frost icon.
    - `high`: Deep blue/white "frozen" effect + pulse animation.
- **Interaction:** Clicking a card triggers `setFocus(node_id)` in the store.

#### B. `StabilityHeroChart.tsx` (Augmentation)
- **Legend:** Add a ❄️ (frost) icon next to node names that appear in the insights list.
- **Hover/Focus State:** Display the specific insight message in the chart tooltip or a floating label.

## 4. Design Philosophy (Cyber-Zen)
- **Haptic Feedback:** Subtle vibrations (where supported) when clicking insight cards.
- **Motion:** Smooth transitions when cards appear/disappear using `AnimatePresence`.
- **Minimalism:** Do not show more than 5 insights at a time; prioritize by `severity`.

## 5. Success Criteria
- [ ] Backend adds less than 5ms overhead for insight calculation.
- [ ] Users can identify "at-risk" nodes in under 2 seconds of looking at the dashboard.
- [ ] Seamless integration with existing "Focus" mechanics.
