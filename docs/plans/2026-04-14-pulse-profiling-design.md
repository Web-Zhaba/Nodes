# Performance Profiling: Pulse Action Lifecycle

## Overview
This design aims to provide a detailed breakdown of the latency involved in triggered a "Pulse" (impulse) in the Nodes application. The user suspects artificial delays affecting responsiveness.

## Goals
- Identify exact millisecond duration of each stage of the Pulse lifecycle.
- Measure Django backend processing time vs. frontend waiting time.
- Verify the impact of existing debouncing and manual timeouts.

## Implementation Details

### 1. Frontend: Telemetry Logging
Modify `nodes-frontend/src/pages/NodesListPage.tsx` and `nodes-frontend/src/lib/djangoApi.ts` to include performance markers.

- **`performance.now()`** will be used for high-precision timing.
- **`console.group`** will display a structured "Performance Report" in the browser console.

| Event | Description |
|---|---|
| `START_ACTION` | Physical interaction (click). |
| `DEBOUNCE_WAIT` | Entering the 800ms debounce buffer. |
| `FETCH_START` | Actual request sent to Django. |
| `FETCH_END` | Response received from Django. |
| `INVALIDATION_START` | Cache invalidation starts. |
| `COMPLETE` | All UI state (Nodes, Cores) scheduled for refresh. |

### 2. Backend: Execution Timing
Modify `nodes-backend/engine/views.py` to capture the duration of the stability calculation.

- Capture `time.perf_counter()` at the start and end of the `post` method.
- Log the duration to the Django console.
- Add an `X-Backend-Runtime-MS` header to the response.

### 3. Usage
The results will be visible in the Browser Developer Tools (Console tab) and the Django server terminal. No UI elements (toasts/modals) will be added to ensure production safety.

## Success Criteria
- A clear report in the browser console for every Pulse action.
- Confirmation of whether the 800ms debounce and 500ms invalidation delay are the primary sources of perceived latency.
