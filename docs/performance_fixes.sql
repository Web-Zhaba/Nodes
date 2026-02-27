-- =========================================================================
-- Фиксы производительности (Performance Advisor)
-- Запустить в SQL Editor Supabase
-- =========================================================================

-- 1. Удаление дублирующих permissive политик (оставляем только 'create')
DROP POLICY IF EXISTS "Users can insert own connections" ON public.connections;
DROP POLICY IF EXISTS "Users can insert own connectors" ON public.connectors;
DROP POLICY IF EXISTS "Users can insert own cores" ON public.cores;
DROP POLICY IF EXISTS "Users can insert own impulses" ON public.impulses;
DROP POLICY IF EXISTS "Users can insert own nodes" ON public.nodes;
DROP POLICY IF EXISTS "Users can insert own daily_focus" ON public.daily_focus;

-- 2. Добавление недостающего индекса для Foreign Key в daily_focus
CREATE INDEX IF NOT EXISTS daily_focus_node_id_idx ON public.daily_focus(node_id);

-- 3. Оптимизация авторизации в RLS (замена auth.uid() на (select auth.uid()))
-- Это предотвращает вызов функции для каждой строки, кэшируя результат на время запроса

-- PROFILES
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING ((select auth.uid()) = id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING ((select auth.uid()) = id);

-- CORES
DROP POLICY IF EXISTS "Users can view own cores" ON public.cores;
CREATE POLICY "Users can view own cores" ON public.cores FOR SELECT USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can create own cores" ON public.cores;
CREATE POLICY "Users can create own cores" ON public.cores FOR INSERT WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can update own cores" ON public.cores;
CREATE POLICY "Users can update own cores" ON public.cores FOR UPDATE USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can delete own cores" ON public.cores;
CREATE POLICY "Users can delete own cores" ON public.cores FOR DELETE USING ((select auth.uid()) = user_id);

-- CONNECTORS
DROP POLICY IF EXISTS "Users can view own connectors" ON public.connectors;
CREATE POLICY "Users can view own connectors" ON public.connectors FOR SELECT USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can create own connectors" ON public.connectors;
CREATE POLICY "Users can create own connectors" ON public.connectors FOR INSERT WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can update own connectors" ON public.connectors;
CREATE POLICY "Users can update own connectors" ON public.connectors FOR UPDATE USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can delete own connectors" ON public.connectors;
CREATE POLICY "Users can delete own connectors" ON public.connectors FOR DELETE USING ((select auth.uid()) = user_id);

-- NODES
DROP POLICY IF EXISTS "Users can view own nodes" ON public.nodes;
CREATE POLICY "Users can view own nodes" ON public.nodes FOR SELECT USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can create own nodes" ON public.nodes;
CREATE POLICY "Users can create own nodes" ON public.nodes FOR INSERT WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can update own nodes" ON public.nodes;
CREATE POLICY "Users can update own nodes" ON public.nodes FOR UPDATE USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can delete own nodes" ON public.nodes;
CREATE POLICY "Users can delete own nodes" ON public.nodes FOR DELETE USING ((select auth.uid()) = user_id);

-- NODE_CONNECTORS
DROP POLICY IF EXISTS "Users can view own node_connectors" ON public.node_connectors;
CREATE POLICY "Users can view own node_connectors" ON public.node_connectors FOR SELECT USING (
  EXISTS (SELECT 1 FROM nodes WHERE nodes.id = node_connectors.node_id AND nodes.user_id = (select auth.uid()))
);

DROP POLICY IF EXISTS "Users can create own node_connectors" ON public.node_connectors;
CREATE POLICY "Users can create own node_connectors" ON public.node_connectors FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM nodes WHERE nodes.id = node_connectors.node_id AND nodes.user_id = (select auth.uid()))
);

DROP POLICY IF EXISTS "Users can delete own node_connectors" ON public.node_connectors;
CREATE POLICY "Users can delete own node_connectors" ON public.node_connectors FOR DELETE USING (
  EXISTS (SELECT 1 FROM nodes WHERE nodes.id = node_connectors.node_id AND nodes.user_id = (select auth.uid()))
);

-- IMPULSES
DROP POLICY IF EXISTS "Users can view own impulses" ON public.impulses;
CREATE POLICY "Users can view own impulses" ON public.impulses FOR SELECT USING (
  EXISTS (SELECT 1 FROM nodes WHERE nodes.id = impulses.node_id AND nodes.user_id = (select auth.uid()))
);

DROP POLICY IF EXISTS "Users can create own impulses" ON public.impulses;
CREATE POLICY "Users can create own impulses" ON public.impulses FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM nodes WHERE nodes.id = impulses.node_id AND nodes.user_id = (select auth.uid()))
);

DROP POLICY IF EXISTS "Users can delete own impulses" ON public.impulses;
CREATE POLICY "Users can delete own impulses" ON public.impulses FOR DELETE USING (
  EXISTS (SELECT 1 FROM nodes WHERE nodes.id = impulses.node_id AND nodes.user_id = (select auth.uid()))
);

-- CONNECTIONS
DROP POLICY IF EXISTS "Users can view own connections" ON public.connections;
CREATE POLICY "Users can view own connections" ON public.connections FOR SELECT USING (
  EXISTS (SELECT 1 FROM nodes WHERE nodes.id = connections.from_node_id AND nodes.user_id = (select auth.uid()))
);

DROP POLICY IF EXISTS "Users can create own connections" ON public.connections;
CREATE POLICY "Users can create own connections" ON public.connections FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM nodes WHERE nodes.id = connections.from_node_id AND nodes.user_id = (select auth.uid()))
);

DROP POLICY IF EXISTS "Users can update own connections" ON public.connections;
CREATE POLICY "Users can update own connections" ON public.connections FOR UPDATE USING (
  EXISTS (SELECT 1 FROM nodes WHERE nodes.id = connections.from_node_id AND nodes.user_id = (select auth.uid()))
);

DROP POLICY IF EXISTS "Users can delete own connections" ON public.connections;
CREATE POLICY "Users can delete own connections" ON public.connections FOR DELETE USING (
  EXISTS (SELECT 1 FROM nodes WHERE nodes.id = connections.from_node_id AND nodes.user_id = (select auth.uid()))
);

-- DAILY_FOCUS
DROP POLICY IF EXISTS "Users can view own daily_focus" ON public.daily_focus;
CREATE POLICY "Users can view own daily_focus" ON public.daily_focus FOR SELECT USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can create own daily_focus" ON public.daily_focus;
CREATE POLICY "Users can create own daily_focus" ON public.daily_focus FOR INSERT WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can update own daily_focus" ON public.daily_focus;
CREATE POLICY "Users can update own daily_focus" ON public.daily_focus FOR UPDATE USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can delete own daily_focus" ON public.daily_focus;
CREATE POLICY "Users can delete own daily_focus" ON public.daily_focus FOR DELETE USING ((select auth.uid()) = user_id);
