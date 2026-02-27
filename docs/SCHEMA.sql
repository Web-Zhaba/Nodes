-- =====================================================
-- Nodes Tracker — Supabase Schema (v2)
-- =====================================================
-- Обновлённая схема с поддержкой множественных коннекторов
-- =====================================================

-- =====================================================
-- 1. Таблицы
-- =====================================================

-- Профили пользователей
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users PRIMARY KEY,
  email TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Ядра (Cores) — гравитационные центры
CREATE TABLE IF NOT EXISTS cores (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  color TEXT NOT NULL DEFAULT '#8b5cf6',
  icon TEXT DEFAULT 'Circle',
  stability_score NUMERIC DEFAULT 0,
  position_x NUMERIC,
  position_y NUMERIC,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Коннекторы (Connectors) — семантические теги
CREATE TABLE IF NOT EXISTS connectors (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  color TEXT NOT NULL DEFAULT '#22c55e',
  is_mainline BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, name)
);

-- Узлы (Nodes) — единицы действий
CREATE TABLE IF NOT EXISTS nodes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,

  -- Устаревшие поля (для обратной совместимости)
  category TEXT DEFAULT 'default',
  frequency TEXT DEFAULT 'daily',

  -- Новые поля v2
  node_type TEXT NOT NULL DEFAULT 'binary' CHECK (node_type IN ('binary', 'quantity', 'duration')),
  mass NUMERIC DEFAULT 1.0 CHECK (mass >= 0.1 AND mass <= 10.0),
  stability_score NUMERIC DEFAULT 0,
  target_value NUMERIC,
  completion_count INTEGER DEFAULT 0,  -- Счётчик полных выполнений узла

  -- Визуальные параметры
  color TEXT DEFAULT '#8b5cf6',
  icon TEXT DEFAULT 'Circle',

  -- Позиция для графа
  position_x NUMERIC,
  position_y NUMERIC,

  -- Связь с основным ядром (опционально)
  core_id UUID REFERENCES cores(id) ON DELETE SET NULL,

  -- Метаданные
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Связь узлов с коннекторами (Many-to-Many)
CREATE TABLE IF NOT EXISTS node_connectors (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  node_id UUID REFERENCES nodes(id) ON DELETE CASCADE NOT NULL,
  connector_id UUID REFERENCES connectors(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(node_id, connector_id)
);

-- Импульсы (Pulses) — отметки о выполнении
CREATE TABLE IF NOT EXISTS impulses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  node_id UUID REFERENCES nodes(id) ON DELETE CASCADE NOT NULL,
  value NUMERIC DEFAULT 1,
  completed_at DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(node_id, completed_at)
);

-- Связи между узлами (Connections)
CREATE TABLE IF NOT EXISTS connections (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  from_node_id UUID REFERENCES nodes(id) ON DELETE CASCADE NOT NULL,
  to_node_id UUID REFERENCES nodes(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL DEFAULT 'enhances',
  strength INTEGER DEFAULT 1,
  connector_id UUID REFERENCES connectors(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CHECK (from_node_id != to_node_id)
);

-- =====================================================
-- 2. Индексы для производительности
-- =====================================================

CREATE INDEX IF NOT EXISTS profiles_id_idx ON profiles(id);
CREATE INDEX IF NOT EXISTS cores_user_id_idx ON cores(user_id);
CREATE INDEX IF NOT EXISTS connectors_user_id_idx ON connectors(user_id);
CREATE INDEX IF NOT EXISTS connectors_name_idx ON connectors(name);
CREATE INDEX IF NOT EXISTS nodes_user_id_idx ON nodes(user_id);
CREATE INDEX IF NOT EXISTS nodes_core_id_idx ON nodes(core_id);
CREATE INDEX IF NOT EXISTS node_connectors_node_id_idx ON node_connectors(node_id);
CREATE INDEX IF NOT EXISTS node_connectors_connector_id_idx ON node_connectors(connector_id);
CREATE INDEX IF NOT EXISTS impulses_node_id_idx ON impulses(node_id);
CREATE INDEX IF NOT EXISTS impulses_completed_at_idx ON impulses(completed_at);
CREATE INDEX IF NOT EXISTS connections_from_node_id_idx ON connections(from_node_id);
CREATE INDEX IF NOT EXISTS connections_to_node_id_idx ON connections(to_node_id);

-- =====================================================
-- 3. RLS (Row Level Security)
-- =====================================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE cores ENABLE ROW LEVEL SECURITY;
ALTER TABLE connectors ENABLE ROW LEVEL SECURITY;
ALTER TABLE nodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE node_connectors ENABLE ROW LEVEL SECURITY;
ALTER TABLE impulses ENABLE ROW LEVEL SECURITY;
ALTER TABLE connections ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 4. Policies для profiles
-- =====================================================

CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING ((select auth.uid()) = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING ((select auth.uid()) = id);

-- =====================================================
-- 5. Policies для cores
-- =====================================================

CREATE POLICY "Users can view own cores"
  ON cores FOR SELECT
  USING ((select auth.uid()) = user_id);

CREATE POLICY "Users can create own cores"
  ON cores FOR INSERT
  WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "Users can update own cores"
  ON cores FOR UPDATE
  USING ((select auth.uid()) = user_id);

CREATE POLICY "Users can delete own cores"
  ON cores FOR DELETE
  USING ((select auth.uid()) = user_id);

-- =====================================================
-- 6. Policies для connectors
-- =====================================================

CREATE POLICY "Users can view own connectors"
  ON connectors FOR SELECT
  USING ((select auth.uid()) = user_id);

CREATE POLICY "Users can create own connectors"
  ON connectors FOR INSERT
  WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "Users can update own connectors"
  ON connectors FOR UPDATE
  USING ((select auth.uid()) = user_id);

CREATE POLICY "Users can delete own connectors"
  ON connectors FOR DELETE
  USING ((select auth.uid()) = user_id);

-- =====================================================
-- 7. Policies для nodes
-- =====================================================

CREATE POLICY "Users can view own nodes"
  ON nodes FOR SELECT
  USING ((select auth.uid()) = user_id);

CREATE POLICY "Users can create own nodes"
  ON nodes FOR INSERT
  WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "Users can update own nodes"
  ON nodes FOR UPDATE
  USING ((select auth.uid()) = user_id);

CREATE POLICY "Users can delete own nodes"
  ON nodes FOR DELETE
  USING ((select auth.uid()) = user_id);

-- =====================================================
-- 8. Policies для node_connectors
-- =====================================================

CREATE POLICY "Users can view own node_connectors"
  ON node_connectors FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM nodes
      WHERE nodes.id = node_connectors.node_id
      AND nodes.user_id = (select auth.uid())
    )
  );

CREATE POLICY "Users can create own node_connectors"
  ON node_connectors FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM nodes
      WHERE nodes.id = node_connectors.node_id
      AND nodes.user_id = (select auth.uid())
    )
  );

CREATE POLICY "Users can delete own node_connectors"
  ON node_connectors FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM nodes
      WHERE nodes.id = node_connectors.node_id
      AND nodes.user_id = (select auth.uid())
    )
  );

-- =====================================================
-- 9. Policies для impulses
-- =====================================================

CREATE POLICY "Users can view own impulses"
  ON impulses FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM nodes
      WHERE nodes.id = impulses.node_id
      AND nodes.user_id = (select auth.uid())
    )
  );

CREATE POLICY "Users can create own impulses"
  ON impulses FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM nodes
      WHERE nodes.id = impulses.node_id
      AND nodes.user_id = (select auth.uid())
    )
  );

CREATE POLICY "Users can delete own impulses"
  ON impulses FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM nodes
      WHERE nodes.id = impulses.node_id
      AND nodes.user_id = (select auth.uid())
    )
  );

-- =====================================================
-- 10. Policies для connections
-- =====================================================

CREATE POLICY "Users can view own connections"
  ON connections FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM nodes
      WHERE nodes.id = connections.from_node_id
      AND nodes.user_id = (select auth.uid())
    )
  );

CREATE POLICY "Users can create own connections"
  ON connections FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM nodes
      WHERE nodes.id = connections.from_node_id
      AND nodes.user_id = (select auth.uid())
    )
  );

CREATE POLICY "Users can update own connections"
  ON connections FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM nodes
      WHERE nodes.id = connections.from_node_id
      AND nodes.user_id = (select auth.uid())
    )
  );

CREATE POLICY "Users can delete own connections"
  ON connections FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM nodes
      WHERE nodes.id = connections.from_node_id
      AND nodes.user_id = (select auth.uid())
    )
  );

-- =====================================================
-- 11. Trigger для автоматического создания profile
-- =====================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email)
  VALUES (NEW.id, NEW.email)
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- =====================================================
-- 12. Trigger для обновления updated_at
-- =====================================================

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_cores_updated_at BEFORE UPDATE ON cores
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_connectors_updated_at BEFORE UPDATE ON connectors
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_nodes_updated_at BEFORE UPDATE ON nodes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =====================================================
-- 13. RPC Функции (Remote Procedure Calls)
-- =====================================================

-- Инкремент счётчика выполнений узла
CREATE OR REPLACE FUNCTION public.increment_completion_count(node_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE public.nodes
  SET completion_count = COALESCE(completion_count, 0) + 1,
      updated_at = NOW()
  WHERE id = node_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- Готово!
-- =====================================================
