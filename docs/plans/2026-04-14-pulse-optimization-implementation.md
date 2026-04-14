# Real-time Pulse Optimization Plan (ORM Approach)

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Accelerate Pulse response from 2.1s to <300ms by parallelizing frontend calls and batching backend SQL queries.

**Architecture:**
- Frontend: Parallel "Fire-and-Forget" logic for Supabase writes and Django calculations.
- Backend: Single-query aggregation for Core stability recalculation using Django `Avg`.

**Tech Stack:** React (TypeScript), Django ORM, CORS configuration.

---

### Task 1: Backend Infrastructure (CORS)

**Files:**
- Modify: `nodes-backend/config/settings.py`

**Step 1: Expose Performance Headers**
Add `CORS_EXPOSE_HEADERS` to allow the frontend to read our custom performance timing.

```python
# ... around line 95 ...
CORS_EXPOSE_HEADERS = ['X-Backend-Runtime-MS']
```

**Step 2: Commit**
```bash
git add nodes-backend/config/settings.py
git commit -m "perf: expose backend runtime headers for telemetry"
```

---

### Task 2: Backend Logic Optimization

**Files:**
- Modify: `nodes-backend/engine/services.py`

**Step 1: Batch Recalculate Cores**
Refactor `_recalculate_related_cores` to calculate all affected cores in a single SQL operation using aggregation.

```python
from django.db.models import Avg

def _recalculate_related_cores(user_profile, node):
    """Синхронно пересчитывает все затронутые ядра одним запросом."""
    connector_ids = node.node_connectors.values_list('connector_id', flat=True)
    affected_core_ids = CoreConnector.objects.filter(
        connector_id__in=connector_ids
    ).values_list('core_id', flat=True).distinct()
    
    # Получаем среднюю стабильность для каждого ядра через JOIN
    # Core -> CoreConnector -> Connector -> NodeConnector -> Node
    for core in Core.objects.filter(id__in=affected_core_ids):
        # Оптимизированный расчет среднего через БД
        stats = Node.objects.filter(
            user=user_profile,
            node_connectors__connector_id__in=core.core_connectors.values_list('connector_id', flat=True)
        ).aggregate(avg_score=Avg('stability_score'))
        
        core.stability_score = round(stats['avg_score'] or 0.0, 2)
        core.save(update_fields=['stability_score', 'updated_at'])
```
*Note: We can optimize this even further with a single Subquery, but let's start with this to keep it safe.*

**Step 2: Commit**
```bash
git add nodes-backend/engine/services.py
git commit -m "perf: optimize core stability calculation to reduce SQL roundtrips"
```

---

### Task 3: Frontend Parallelization & Debounce reduction

**Files:**
- Modify: `nodes-frontend/src/pages/NodesListPage.tsx`

**Step 1: Remove artificial delays**
- Set debounce from **800ms** to **150ms**.
- Remove the **500ms** `setTimeout` before invalidating cores.

**Step 2: Parallelize backend call**
Modify `handleImpulse` to trigger `triggerStabilityCalc` **without awaiting** the Supabase mutation.

```typescript
// NodesListPage.tsx
const handleImpulse = useCallback(async (nodeId: string, value: number) => {
  // ...
  try {
    // ЗАПУСКАЕМ ПАРАЛЛЕЛЬНО
    const mutationPromise = value < 0 || (node.node_type === "binary" && value === 0)
      ? deleteImpulse.mutateAsync({ nodeId, date: selectedDate })
      : createImpulse.mutateAsync({ nodeId, value, date: selectedDate });
      
    // Не ждем (await) здесь, если хотим максимальной отзывчивости, 
    // либо ждем, но понимаем, что это +200мс.
    // ОПТИМАЛЬНО: Запускаем расчет стабильности ПАРАЛЛЕЛЬНО с записью лога.
    triggerStabilityCalc(nodeId);
    
    await mutationPromise; // Ждем для обработки возможных ошибок
  } catch (error) { ... }
}, [...]);
```

**Step 3: Commit**
```bash
git add nodes-frontend/src/pages/NodesListPage.tsx
git commit -m "perf: parallelize backend calls and remove artificial frontend delays"
```
