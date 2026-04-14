# Pulse Profiling Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Implement detailed performance logging for the "Pulse" (impulse) action to identify and measure artificial delays.

**Architecture:** Add high-precision timers (`performance.now()` on frontend, `time.perf_counter()` on backend) and log the lifecycle from click to UI update.

**Tech Stack:** React (TypeScript), Django (DRF), performance.now(), console.group.

---

### Task 1: Backend Execution Timing

**Files:**
- Modify: `nodes-backend/engine/views.py`

**Step 1: Write timing logic in view**

```python
import time
# ... existing imports ...

class RecalculateStabilityView(APIView):
    def post(self, request):
        start_time = time.perf_counter()
        
        # ... logic ...
        
        runtime_ms = (time.perf_counter() - start_time) * 1000
        response = Response(
            {"status": "success", "node_id": str(node_id) if node_id else None},
            status=200
        )
        response['X-Backend-Runtime-MS'] = f"{runtime_ms:.2f}"
        print(f"\n[PERF] Stability Calculation Backend Runtime: {runtime_ms:.2f}ms")
        return response
```

**Step 2: Verify by making a manual request (if possible) or moving to Task 2**

**Step 3: Commit**

```bash
git add nodes-backend/engine/views.py
git commit -m "debug: add backend execution timing for stability calculation"
```

---

### Task 2: Django API Helper Enhancement

**Files:**
- Modify: `nodes-frontend/src/lib/djangoApi.ts`

**Step 1: Update `calculateStability` to capture timing**

```typescript
export async function calculateStability(
  nodeId?: string
): Promise<{ success: boolean; data?: any; error?: string; backendMs?: string }> {
  // ... existing code ...
    const response = await fetch(`${DJANGO_API_URL}/stability/calculate/`, { ... });
    
    // ... logic ...
    
    const backendMs = response.headers.get('X-Backend-Runtime-MS') || 'unknown';
    const data = await response.json();
    return { success: true, data, backendMs };
  // ...
}
```

**Step 2: Commit**

```bash
git add nodes-frontend/src/lib/djangoApi.ts
git commit -m "debug: enhance djangoApi to return backend processing time"
```

---

### Task 3: Frontend Component Profiling

**Files:**
- Modify: `nodes-frontend/src/pages/NodesListPage.tsx`

**Step 1: Wrap `handleImpulse` and `triggerStabilityCalc` with performance markers**

```typescript
// Define refs for profiling
const perfRef = useRef<{ start: number; clickStart: number }>({ start: 0, clickStart: 0 });

const triggerStabilityCalc = useCallback((nodeId?: string) => {
  const debounceStart = performance.now();
  console.log(`[PERF] ⏱ Debounce stage started at ${Math.round(debounceStart - perfRef.current.clickStart)}ms from click`);

  if (debounceTimer.current) clearTimeout(debounceTimer.current);
  debounceTimer.current = setTimeout(async () => {
    const fetchStart = performance.now();
    console.log(`[PERF] 🚀 Sending request to Django (Wait time: ${Math.round(fetchStart - debounceStart)}ms)`);
    
    const res = await calculateStability(nodeId);
    const fetchEnd = performance.now();
    
    console.group(`[PERF] Pulse Action Report (Node: ${nodeId})`);
    console.log(`- Request Duration: ${Math.round(fetchEnd - fetchStart)}ms`);
    console.log(`- Backend Internal: ${res.backendMs}ms`);
    console.log(`- Total from click: ${Math.round(fetchEnd - perfRef.current.clickStart)}ms`);
    
    if (res.success) {
      console.log(`- 🔄 Invalidating queries (Nodes, Connectors)...`);
      queryClient.invalidateQueries({ queryKey: ["nodes"] });
      queryClient.invalidateQueries({ queryKey: ["connectors"] });
      
      const invStart = performance.now();
      setTimeout(() => {
        console.log(`- 🔄 Invalidating Cores (Wait: ${Math.round(performance.now() - invStart)}ms)`);
        queryClient.invalidateQueries({ queryKey: ["cores"] });
        console.log(`- ✅ ALL STEPS COMPLETE. Final time: ${Math.round(performance.now() - perfRef.current.clickStart)}ms`);
        console.groupEnd();
      }, 500);
    } else {
      console.groupEnd();
    }
  }, 800);
}, [queryClient, perfRef]);

const handleImpulse = useCallback(async (nodeId: string, value: number) => {
  perfRef.current.clickStart = performance.now();
  console.log('\n--- PULSE TRIGGERED ---');
  // ... existing logic ...
}, [...]);
```

**Step 2: Commit**

```bash
git add nodes-frontend/src/pages/NodesListPage.tsx
git commit -m "debug: implement full lifecycle profiling for Pulse action"
```
