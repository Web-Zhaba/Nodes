-- ============================================================
-- Migration 004: Neural Public Sharing
-- Run in Supabase SQL Editor
-- ============================================================

-- 1. PROFILES — публичный профиль
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS is_public    BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS public_slug  TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS bio          TEXT;

-- 2. CORES — публичные ядра
ALTER TABLE public.cores
  ADD COLUMN IF NOT EXISTS is_public    BOOLEAN DEFAULT false;

-- 3. NODES — публичные узлы
ALTER TABLE public.nodes
  ADD COLUMN IF NOT EXISTS is_public    BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS share_token  UUID DEFAULT gen_random_uuid();

-- 4. IMPULSES — публичные импульсы
ALTER TABLE public.impulses
  ADD COLUMN IF NOT EXISTS is_public    BOOLEAN DEFAULT false;

-- ============================================================
-- RLS: разрешаем анонимному role читать публичные записи
-- ============================================================

-- Profiles
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
CREATE POLICY "Public profiles are viewable by everyone"
  ON public.profiles FOR SELECT
  USING (is_public = true);

-- Cores
DROP POLICY IF EXISTS "Public cores are viewable by everyone" ON public.cores;
CREATE POLICY "Public cores are viewable by everyone"
  ON public.cores FOR SELECT
  USING (is_public = true);

-- Nodes
DROP POLICY IF EXISTS "Public nodes are viewable by everyone" ON public.nodes;
CREATE POLICY "Public nodes are viewable by everyone"
  ON public.nodes FOR SELECT
  USING (is_public = true);

-- Impulses (видны, если узел публичный)
DROP POLICY IF EXISTS "Public impulses are viewable by everyone" ON public.impulses;
CREATE POLICY "Public impulses are viewable by everyone"
  ON public.impulses FOR SELECT
  USING (
    is_public = true 
    OR node_id IN (SELECT id FROM public.nodes WHERE is_public = true)
  );

-- Connectors (видны, если профиль публичный)
DROP POLICY IF EXISTS "Connectors are viewable by everyone if profile is public" ON public.connectors;
CREATE POLICY "Connectors are viewable by everyone if profile is public"
  ON public.connectors FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p 
      WHERE p.id = user_id AND p.is_public = true
    )
  );

-- Node Connectors (связи узлов с тегами, нужны для графа)
DROP POLICY IF EXISTS "Node connectors are viewable by everyone if profile is public" ON public.node_connectors;
CREATE POLICY "Node connectors are viewable by everyone if profile is public"
  ON public.node_connectors FOR SELECT
  USING (
    node_id IN (SELECT id FROM public.nodes WHERE is_public = true)
  );

-- Core Connectors (связи ядер с тегами, нужны для графа)
DROP POLICY IF EXISTS "Core connectors are viewable by everyone if profile is public" ON public.core_connectors;
CREATE POLICY "Core connectors are viewable by everyone if profile is public"
  ON public.core_connectors FOR SELECT
  USING (
    core_id IN (SELECT id FROM public.cores WHERE is_public = true)
  );

-- ============================================================
-- Индексы для быстрого поиска по slug / share_token
-- ============================================================
CREATE INDEX IF NOT EXISTS profiles_public_slug_idx  ON public.profiles(public_slug);
CREATE INDEX IF NOT EXISTS nodes_share_token_idx     ON public.nodes(share_token);
CREATE INDEX IF NOT EXISTS nodes_is_public_idx       ON public.nodes(is_public);
CREATE INDEX IF NOT EXISTS cores_is_public_idx       ON public.cores(is_public);
CREATE INDEX IF NOT EXISTS impulses_node_id_idx      ON public.impulses(node_id);
CREATE INDEX IF NOT EXISTS impulses_completed_at_idx ON public.impulses(completed_at);
