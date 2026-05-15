# Analytics Dashboard Design (v2: Interactive Drill-down)

## Context
Nodes Analytics page using a **Drill-down architecture (In-place morphing)**. Instead of a generic radar chart, we focus on deep interaction with specific nodes directly through the charts.

## Architecture & State Management (Zustand)
- `useAnalyticsStore` built in Zustand to manage the "Global vs Focused" state:
  - `focusEntity: { type: 'node' | 'core', id: string } | null`
  - `setFocus: (type, id) => void`
  - `clearFocus: () => void`
- A single "Fat Payload" data architecture where Django sends the raw pulse history for all nodes.

## Data Flow
- Django exposes `GET /api/analytics/history?days=30` returning aggregated daily stability and pulse counts.
- React Frontend fetches this once and stores it in Zustand.
- All dashboard components (Charts, Heatmaps, Stats) reactive filter their view based on `focusEntity`.

## UI Components & Interaction logic
1. **`AnalyticsPage`**: Root container. Orchestrates data fetching and layout animations.
2. **`GlobalControlBar`**: 
   - Displays current focus context (e.g., "All Nodes" or "Node: Reading").
   - Contains the **"Вернуться к обычному виду"** button (visible only when `focusEntity !== null`).
3. **`StabilityHeroChart` (The Engine)**:
   - **Multi-line View**: Renders lines for all active nodes.
   - **Hover Effect**: Dims non-hovered lines to `opacity: 0.1` and boosts neon glow of the target line.
   - **Click Logic**: Sets `focusEntity` to the clicked node.
   - **Empty Area Click**: Calls `clearFocus()` to return to the global view.
4. **`PulseHeatmap`**: 
   - **Global Mode**: Shows cumulative pulses across all nodes.
   - **Focus Mode**: Morphs to show only pulses for the selected node.
5. **`PulseDetailsTooltip`**: Custom Recharts tooltip that shows a list of specific pulses/values when clicking or hovering on a day point.

## Visual Style
- **Cyber-Zen Aesthetic**: Dark backgrounds, glassmorphism containers.
- **Neon Accents**: Each node has a distinct primary color for its line.
- **Animations**: Framer Motion transitions for layout shifts and line opacities.
