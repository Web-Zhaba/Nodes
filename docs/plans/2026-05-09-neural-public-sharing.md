# Neural Public Sharing Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Implement public sharing for the graph, individual nodes, and pulses with granular privacy controls and read-only views.

**Context:** 
Nodes is a "Second Brain" for action tracking. Users visualize their life as a force-directed graph. 
"Neural Public Sharing" allows users to showcase their progress, stability, and "Life Architecture" to others via unique, read-only links. 
This is key for social proof (Proof of Action) and project virality.

**Architecture:**
1. **Database:** Update `profiles`, `nodes`, and `impulses` tables in Supabase with `is_public` flags and `share_slug`/`share_token` fields.
2. **Auth & Security:** Update Supabase RLS policies to allow anonymous (`anon`) role access to public records.
3. **Frontend (FSD):** 
   - New routes under `/share/` using specialized "Public" pages.
   - Shared business logic via a new `publicService`.
   - Read-only visual components (Graph, Charts).
4. **Metadata:** Dynamic OpenGraph tags for rich previews in social media.

**Tech Stack:** React, TypeScript, Supabase, TanStack Query, react-force-graph-2d, Recharts, Shadcn UI.

---

### Task 1: Database & RLS Update (Core Infrastructure)

**Files:**
- Modify: `docs/supabase-schema.sql`

**Step 1: Write SQL migration for public access**

```sql
-- Добавление полей публичности
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT false;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS public_slug TEXT UNIQUE;

ALTER TABLE public.nodes ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT false;
ALTER TABLE public.nodes ADD COLUMN IF NOT EXISTS share_token UUID DEFAULT gen_random_uuid();

ALTER TABLE public.impulses ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT false;

-- Обновление политик RLS для анонимного доступа (anon роль)
-- Позволяет любому видеть записи, где is_public = true
CREATE POLICY "Public profiles are viewable by everyone" 
ON public.profiles FOR SELECT USING (is_public = true);

CREATE POLICY "Public nodes are viewable by everyone" 
ON public.nodes FOR SELECT USING (is_public = true);

CREATE POLICY "Public impulses are viewable by everyone" 
ON public.impulses FOR SELECT USING (is_public = true);
```

**Step 2: Run migration**
Execute SQL in Supabase SQL Editor.

**Step 3: Commit**

```bash
git add docs/supabase-schema.sql
git commit -m "db: add public sharing columns and RLS policies"
```

### Task 2: Public Data Service (API Layer)

**Files:**
- Create: `nodes-frontend/src/services/public.service.ts`
- Test: `nodes-frontend/src/services/__tests__/public.service.test.ts`

**Step 1: Write failing test for data fetching**
Verify that we can fetch a profile and its public nodes by slug.

**Step 2: Implement publicService**

```typescript
import { supabase } from '../lib/supabase';

export const publicService = {
  async getProfileBySlug(slug: string) {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, username, public_slug, avatar_url, bio')
      .eq('public_slug', slug)
      .eq('is_public', true)
      .single();
    if (error) return null;
    return data;
  },

  async getPublicNodes(userId: string) {
    const { data, error } = await supabase
      .from('nodes')
      .select('*, node_connectors(connector_id)')
      .eq('user_id', userId)
      .eq('is_public', true);
    if (error) return [];
    return data;
  }
};
```

**Step 3: Commit**

```bash
git add nodes-frontend/src/services/public.service.ts
git commit -m "feat: add publicService for read-only data access"
```

### Task 3: Public Graph Page (Visual Showcase)

**Files:**
- Create: `nodes-frontend/src/pages/PublicGraphPage.tsx`
- Modify: `nodes-frontend/src/App.tsx`

**Step 1: Implement Read-Only Graph View**
- Use `react-force-graph-2d`.
- Disable node dragging or editing features.
- Show `stability_score` as node brightness/size.

**Step 2: Setup dynamic Routing**
Add `<Route path="/share/u/:slug" element={<PublicGraphPage />} />` to `App.tsx`.

**Step 3: Commit**

```bash
git commit -m "feat: implement public graph showcase page"
```

### Task 4: Public Node Details & Analytics

**Files:**
- Create: `nodes-frontend/src/pages/PublicNodePage.tsx`

**Step 1: Implement Analytics View**
- **Heatmap:** Use a CSS Grid to show activity (pulses) over time.
- **Stability Chart:** Use `Recharts` (AreaChart) to show `stability_score` history.
- **Node Info:** Display label, type, and total mass.

**Step 2: Commit**

```bash
git commit -m "feat: add public node details with Recharts analytics"
```

### Task 5: Sharing Controls in UI (Integration)

**Files:**
- Modify: `nodes-frontend/src/features/nodes/components/NodeSettings.tsx`
- Modify: `nodes-frontend/src/features/profile/sections/PrivacySection.tsx`

**Step 1: Add Share Toggles**
- Use Shadcn `Switch` for `is_public` toggle.
- Add a `Input` field with the shareable URL (read-only).
- Add a `Button` to "Copy Link" using `navigator.clipboard`.

**Step 2: Commit**

```bash
git commit -m "feat: add sharing toggles and link copying to settings"
```

---

### ✅ Final Checklist for the Engineer
- [ ] RLS policies allow fetching data without a JWT.
- [ ] Private nodes are NEVER returned in public queries.
- [ ] Public pages have meta tags for Discord/Telegram previews.
- [ ] No "Edit" or "Delete" buttons are visible on public pages.
