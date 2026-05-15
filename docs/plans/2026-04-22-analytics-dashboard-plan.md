# Analytics Dashboard Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a robust Analytics Dashboard tracking User Node Stability and Pulses seamlessly using an In-place Morphing architecture with Frontend pre-aggregation.

**Architecture:** Single fat payload fetch from Django on page mount. React (Zustand) filters data based on focused element. Shadcn UI charts handle interactive and responsive rendering.

**Tech Stack:** React, Zustand, Tailwind 4, Shadcn UI (Recharts), Django (DRF)

---

### Task 1: Initialize Shadcn Charts

**Files:**
- Modify: `nodes-frontend/package.json`

**Step 1: Install Charts Dependency**
We need `recharts` since Shadcn Charts wraps it.
Run: `npx shadcn@latest add chart`
If smoothui-cli is needed for contribution graph:
Run: `npx smoothui-cli add contribution-graph` (Or install specific contribution graph equivalent).

---

### Task 2: Analytics API Endpoint (Django)

**Files:**
- Modify: `nodes-backend/engine/views.py`
- Modify: `nodes-backend/engine/urls.py`

**Step 1: Write API View**
```python
# nodes-backend/engine/views.py
from rest_framework.decorators import api_view
from rest_framework.response import Response
from datetime import timedelta
from django.utils import timezone
from .models import Pulse

@api_view(['GET'])
def get_analytics_history(request):
    days = int(request.query_params.get('days', 30))
    limit_date = timezone.now() - timedelta(days=days)
    
    # Needs optimization in real environment, basic query for now
    pulses = Pulse.objects.filter(timestamp__gte=limit_date)
    # Map pulse values over dates
    
    return Response({"status": "ok", "data": "pulse data formatted"})
```

**Step 2: Add to urls**
```python
# nodes-backend/engine/urls.py
from django.urls import path
from . import views

urlpatterns = [
    # ... other paths
    path('api/analytics/history', views.get_analytics_history, name='analytics_history'),
]
```

**Step 3: Run Server**
Run: `python manage.py runserver`
Expected: PASS

---

### Task 3: Zustand Analytics Store

**Files:**
- Create: `nodes-frontend/src/store/useAnalyticsStore.ts`

**Step 1: Write minimal implementation**
```typescript
import { create } from 'zustand';

type FocusEntity = { type: 'node' | 'core'; id: string } | null;

interface AnalyticsState {
  focusEntity: FocusEntity;
  setFocus: (entity: FocusEntity) => void;
  clearFocus: () => void;
}

export const useAnalyticsStore = create<AnalyticsState>((set) => ({
  focusEntity: null,
  setFocus: (entity) => set({ focusEntity: entity }),
  clearFocus: () => set({ focusEntity: null }),
}));
```

---

### Task 4: Analytics Page Scaffold

**Files:**
- Create: `nodes-frontend/src/pages/AnalyticsPage.tsx`
- Modify: `nodes-frontend/src/App.tsx` (Route Registration)

**Step 1: Create Page**
```tsx
import React, { useEffect } from 'react';
import { useAnalyticsStore } from '../store/useAnalyticsStore';

export const AnalyticsPage = () => {
    const { focusEntity, clearFocus } = useAnalyticsStore();
    
    // Initial Fetch logic placeholder
    
    return (
        <div className="p-6">
            <header className="flex justify-between items-center mb-8">
               <h1 className="text-2xl font-bold">Analytics</h1>
               {focusEntity && <button onClick={clearFocus}>Reset Focus</button>}
            </header>
            <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
                {/* Charts go here */}
            </div>
        </div>
    );
}
```

**Step 2: Add Route**
Register `/analytics` inside `App.tsx` / `Router`.

---

### Task 5: Stability Hero Chart

**Files:**
- Create: `nodes-frontend/src/features/analytics/components/StabilityHeroChart.tsx`

**Step 1: Implement Wrapper**
Implement basic Recharts AreaChart using Shadcn `ChartContainer`, referencing dynamic data from `useAnalyticsStore`.

---

### Task 6: Pulse Heatmap

**Files:**
- Create: `nodes-frontend/src/features/analytics/components/PulseHeatmap.tsx`

**Step 1: Implement Heatmap**
Use installed contribution-graph logic. Map global pulses if `focusEntity === null`, or isolated pulses otherwise.
