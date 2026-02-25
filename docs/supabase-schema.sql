-- =====================================================
-- Nodes Tracker — Supabase Schema
-- =====================================================
-- Этот файл содержит SQL для создания всех таблиц
-- Скопируй содержимое в SQL Editor в Supabase и запусти
-- =====================================================

-- Профили пользователей
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users PRIMARY KEY,
  email TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Узлы (привычки)
CREATE TABLE IF NOT EXISTS nodes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL DEFAULT 'health',
  frequency TEXT NOT NULL DEFAULT 'daily',
  color TEXT,
  icon TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Импульсы (выполнения)
CREATE TABLE IF NOT EXISTS impulses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  node_id UUID REFERENCES nodes(id) ON DELETE CASCADE NOT NULL,
  completed_at DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(node_id, completed_at)
);

-- Связи между узлами
CREATE TABLE IF NOT EXISTS connections (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  from_node_id UUID REFERENCES nodes(id) ON DELETE CASCADE NOT NULL,
  to_node_id UUID REFERENCES nodes(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL DEFAULT 'enhances',
  strength INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CHECK (from_node_id != to_node_id)
);

-- Индексы для производительности
CREATE INDEX IF NOT EXISTS nodes_user_id_idx ON nodes(user_id);
CREATE INDEX IF NOT EXISTS impulses_node_id_idx ON impulses(node_id);
CREATE INDEX IF NOT EXISTS impulses_completed_at_idx ON impulses(completed_at);
CREATE INDEX IF NOT EXISTS connections_from_node_id_idx ON connections(from_node_id);
CREATE INDEX IF NOT EXISTS connections_to_node_id_idx ON connections(to_node_id);

-- RLS (Row Level Security) — включаем безопасность
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE nodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE impulses ENABLE ROW LEVEL SECURITY;
ALTER TABLE connections ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- Policies для profiles
-- =====================================================

-- Пользователь может видеть свой профиль
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

-- Пользователь может обновлять свой профиль
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- =====================================================
-- Policies для nodes
-- =====================================================

-- Пользователь может видеть свои узлы
CREATE POLICY "Users can view own nodes"
  ON nodes FOR SELECT
  USING (auth.uid() = user_id);

-- Пользователь может создавать свои узлы
CREATE POLICY "Users can insert own nodes"
  ON nodes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Пользователь может обновлять свои узлы
CREATE POLICY "Users can update own nodes"
  ON nodes FOR UPDATE
  USING (auth.uid() = user_id);

-- Пользователь может удалять свои узлы
CREATE POLICY "Users can delete own nodes"
  ON nodes FOR DELETE
  USING (auth.uid() = user_id);

-- =====================================================
-- Policies для impulses
-- =====================================================

-- Пользователь может видеть свои импульсы (через nodes)
CREATE POLICY "Users can view own impulses"
  ON impulses FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM nodes
      WHERE nodes.id = impulses.node_id
      AND nodes.user_id = auth.uid()
    )
  );

-- Пользователь может создавать свои импульсы
CREATE POLICY "Users can insert own impulses"
  ON impulses FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM nodes
      WHERE nodes.id = impulses.node_id
      AND nodes.user_id = auth.uid()
    )
  );

-- Пользователь может удалять свои импульсы
CREATE POLICY "Users can delete own impulses"
  ON impulses FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM nodes
      WHERE nodes.id = impulses.node_id
      AND nodes.user_id = auth.uid()
    )
  );

-- =====================================================
-- Policies для connections
-- =====================================================

-- Пользователь может видеть свои связи
CREATE POLICY "Users can view own connections"
  ON connections FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM nodes
      WHERE nodes.id = connections.from_node_id
      AND nodes.user_id = auth.uid()
    )
  );

-- Пользователь может создавать свои связи
CREATE POLICY "Users can insert own connections"
  ON connections FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM nodes
      WHERE nodes.id = connections.from_node_id
      AND nodes.user_id = auth.uid()
    )
  );

-- Пользователь может обновлять свои связи
CREATE POLICY "Users can update own connections"
  ON connections FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM nodes
      WHERE nodes.id = connections.from_node_id
      AND nodes.user_id = auth.uid()
    )
  );

-- Пользователь может удалять свои связи
CREATE POLICY "Users can delete own connections"
  ON connections FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM nodes
      WHERE nodes.id = connections.from_node_id
      AND nodes.user_id = auth.uid()
    )
  );

-- =====================================================
-- Trigger для автоматического создания profile
-- =====================================================

-- Функция для создания профиля при регистрации
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email)
  VALUES (NEW.id, NEW.email);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger на создание пользователя
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- =====================================================
-- Готово!
-- =====================================================
