-- ============================================================
-- NODES: Supabase Schema (актуальная версия, март 2026)
-- ============================================================
-- Это актуальная схема БД, синхронизированная с кодом.
-- Таблицы Django (auth_*, django_*) создаются автоматически
-- через `python manage.py migrate` и здесь не описаны.
-- ============================================================

-- Enum для типов узлов
CREATE TYPE node_type AS ENUM ('binary', 'quantity', 'duration');

-- ------------------------------------------------------------
-- PROFILES (расширение auth.users от Supabase)
-- ------------------------------------------------------------
CREATE TABLE public.profiles (
  id                uuid NOT NULL,
  email             text,
  display_name      text,
  daily_reset_time  text DEFAULT '00:00',
  first_day_of_week integer DEFAULT 1,
  language          text DEFAULT 'ru',
  show_greeting     boolean DEFAULT true,
  custom_greeting   text DEFAULT 'Привет, {name}',
  theme_config      jsonb DEFAULT '{}'::jsonb,
  -- Neural Public Sharing (migration 004)
  is_public         boolean DEFAULT false,
  public_slug       text UNIQUE,
  bio               text,
  created_at        timestamp with time zone DEFAULT now(),
  updated_at        timestamp with time zone DEFAULT now(),
  CONSTRAINT profiles_pkey PRIMARY KEY (id),
  CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id)
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- Автосоздание профиля при регистрации
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, display_name)
  VALUES (new.id, new.email, split_part(new.email, '@', 1));
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- ------------------------------------------------------------
-- CONNECTORS (семантические теги / связи между узлами)
-- ------------------------------------------------------------
CREATE TABLE public.connectors (
  id          uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL,
  name        text NOT NULL,
  description text,
  color       text NOT NULL DEFAULT '#22c55e'::text,
  is_mainline boolean DEFAULT false,
  created_at  timestamp with time zone DEFAULT now(),
  updated_at  timestamp with time zone DEFAULT now(),
  CONSTRAINT connectors_pkey PRIMARY KEY (id),
  CONSTRAINT connectors_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id)
);

ALTER TABLE public.connectors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own connectors"
  ON public.connectors FOR ALL
  USING (auth.uid() = user_id);

-- ------------------------------------------------------------
-- CORES (гравитационные ядра / сферы жизни)
-- ------------------------------------------------------------
CREATE TABLE public.cores (
  id              uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id         uuid NOT NULL,
  name            text NOT NULL,
  description     text,
  color           text NOT NULL DEFAULT '#6366f1'::text,
  icon            text,
  stability_score numeric DEFAULT 0,   -- Агрегированная стабильность ядра [0..100]
  position_x      numeric,             -- Позиция в force-graph
  position_y      numeric,
  created_at      timestamp with time zone DEFAULT now(),
  updated_at      timestamp with time zone DEFAULT now(),
  CONSTRAINT cores_pkey PRIMARY KEY (id),
  CONSTRAINT cores_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id)
);

ALTER TABLE public.cores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own cores"
  ON public.cores FOR ALL
  USING (auth.uid() = user_id);

-- ------------------------------------------------------------
-- CORE_CONNECTORS (многие-ко-многим: Core ↔ Connector)
-- Ядро "притягивает" узлы, у которых есть соответствующий коннектор
-- ------------------------------------------------------------
CREATE TABLE public.core_connectors (
  id           uuid NOT NULL DEFAULT gen_random_uuid(),
  core_id      uuid NOT NULL,
  connector_id uuid NOT NULL,
  created_at   timestamp with time zone DEFAULT now(),
  CONSTRAINT core_connectors_pkey PRIMARY KEY (id),
  CONSTRAINT core_connectors_core_id_fkey      FOREIGN KEY (core_id)      REFERENCES public.cores(id) ON DELETE CASCADE,
  CONSTRAINT core_connectors_connector_id_fkey FOREIGN KEY (connector_id) REFERENCES public.connectors(id) ON DELETE CASCADE
);

ALTER TABLE public.core_connectors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own core_connectors"
  ON public.core_connectors FOR ALL
  USING (
    auth.uid() = (SELECT user_id FROM public.cores WHERE id = core_id)
  );

-- ------------------------------------------------------------
-- NODES (узлы — единицы действия)
-- ------------------------------------------------------------
CREATE TABLE public.nodes (
  id               uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id          uuid NOT NULL,
  name             text NOT NULL,
  description      text,
  category         text NOT NULL DEFAULT 'health'::text,  -- Устаревшее поле (используем connectors)
  frequency        text NOT NULL DEFAULT 'daily'::text,
  color            text,
  icon             text,
  node_type        node_type NOT NULL DEFAULT 'binary'::node_type,
  mass             numeric NOT NULL DEFAULT 1.0,          -- Сложность узла (влияет на физику графа)
  stability_score  numeric DEFAULT 0,                     -- Текущая стабильность [0..100], пишет Django
  target_value     numeric,                               -- Цель для quantity/duration узлов
  core_id          uuid,                                  -- Прямая связь с ядром (устаревшая, используем node_connectors)
  position_x       numeric,
  position_y       numeric,
  completion_count integer DEFAULT 0,
  is_focus_default boolean DEFAULT false,
  created_at       timestamp with time zone DEFAULT now(),
  updated_at       timestamp with time zone DEFAULT now(),
  CONSTRAINT nodes_pkey PRIMARY KEY (id),
  CONSTRAINT nodes_user_id_fkey  FOREIGN KEY (user_id)  REFERENCES public.profiles(id),
  CONSTRAINT nodes_core_id_fkey  FOREIGN KEY (core_id)  REFERENCES public.cores(id)
);

ALTER TABLE public.nodes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own nodes"
  ON public.nodes FOR ALL
  USING (auth.uid() = user_id);

-- ------------------------------------------------------------
-- NODE_CONNECTORS (многие-ко-многим: Node ↔ Connector)
-- Узел может иметь несколько коннекторов → попадает в несколько ядер
-- ------------------------------------------------------------
CREATE TABLE public.node_connectors (
  id           uuid NOT NULL DEFAULT gen_random_uuid(),
  node_id      uuid NOT NULL,
  connector_id uuid NOT NULL,
  created_at   timestamp with time zone DEFAULT now(),
  CONSTRAINT node_connectors_pkey PRIMARY KEY (id),
  CONSTRAINT node_connectors_node_id_fkey      FOREIGN KEY (node_id)      REFERENCES public.nodes(id) ON DELETE CASCADE,
  CONSTRAINT node_connectors_connector_id_fkey FOREIGN KEY (connector_id) REFERENCES public.connectors(id) ON DELETE CASCADE
);

ALTER TABLE public.node_connectors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own node_connectors"
  ON public.node_connectors FOR ALL
  USING (
    auth.uid() = (SELECT user_id FROM public.nodes WHERE id = node_id)
  );

-- ------------------------------------------------------------
-- IMPULSES (импульсы — факты выполнения узла)
-- ------------------------------------------------------------
CREATE TABLE public.impulses (
  id           uuid NOT NULL DEFAULT gen_random_uuid(),
  node_id      uuid NOT NULL,
  completed_at date NOT NULL DEFAULT CURRENT_DATE,
  value        numeric DEFAULT 1,  -- Для quantity/duration: сколько сделано
  created_at   timestamp with time zone DEFAULT now(),
  CONSTRAINT impulses_pkey PRIMARY KEY (id),
  CONSTRAINT impulses_node_id_fkey FOREIGN KEY (node_id) REFERENCES public.nodes(id) ON DELETE CASCADE
);

ALTER TABLE public.impulses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own impulses"
  ON public.impulses FOR ALL
  USING (
    auth.uid() = (SELECT user_id FROM public.nodes WHERE id = node_id)
  );

-- ------------------------------------------------------------
-- CONNECTIONS (прямые связи между узлами — граф влияния)
-- Пока не используется активно, зарезервировано для будущего
-- ------------------------------------------------------------
CREATE TABLE public.connections (
  id           uuid NOT NULL DEFAULT gen_random_uuid(),
  from_node_id uuid NOT NULL,
  to_node_id   uuid NOT NULL,
  type         text NOT NULL DEFAULT 'enhances'::text,  -- 'enhances' | 'blocks'
  strength     integer DEFAULT 1,
  connector_id uuid,  -- Опциональная привязка к коннектору
  created_at   timestamp with time zone DEFAULT now(),
  CONSTRAINT connections_pkey PRIMARY KEY (id),
  CONSTRAINT connections_from_node_id_fkey  FOREIGN KEY (from_node_id)  REFERENCES public.nodes(id),
  CONSTRAINT connections_to_node_id_fkey    FOREIGN KEY (to_node_id)    REFERENCES public.nodes(id),
  CONSTRAINT connections_connector_id_fkey  FOREIGN KEY (connector_id)  REFERENCES public.connectors(id)
);

ALTER TABLE public.connections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own connections"
  ON public.connections FOR ALL
  USING (
    auth.uid() = (SELECT user_id FROM public.nodes WHERE id = from_node_id)
  );

-- ------------------------------------------------------------
-- DAILY_FOCUS (какие узлы в фокусе на конкретный день)
-- ------------------------------------------------------------
CREATE TABLE public.daily_focus (
  id         uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id    uuid NOT NULL,
  node_id    uuid NOT NULL,
  focus_date date NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT daily_focus_pkey PRIMARY KEY (id),
  CONSTRAINT daily_focus_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id),
  CONSTRAINT daily_focus_node_id_fkey FOREIGN KEY (node_id) REFERENCES public.nodes(id) ON DELETE CASCADE
);

ALTER TABLE public.daily_focus ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own daily_focus"
  ON public.daily_focus FOR ALL
  USING (auth.uid() = user_id);

-- ============================================================
-- ПРИМЕЧАНИЕ: Django-таблицы
-- ============================================================
-- Следующие таблицы создаются автоматически Django при запуске
-- `python manage.py migrate` и не требуют ручного создания:
--
--   django_migrations, django_content_type, django_session,
--   django_admin_log, auth_user, auth_group,
--   auth_permission, auth_user_groups, auth_user_user_permissions,
--   auth_group_permissions
--
-- Они используются только Django ORM и не связаны с Supabase Auth.
-- ============================================================
