-- Таблица пользовательских настроек (темы, UI)
CREATE TABLE IF NOT EXISTS public.user_preferences (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  theme_config JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Включаем RLS
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;

-- Политика: Пользователь может видеть только свои настройки
CREATE POLICY "Users can view own preferences" 
  ON public.user_preferences 
  FOR SELECT 
  USING (auth.uid() = user_id);

-- Политика: Пользователь может создавать свои настройки
CREATE POLICY "Users can insert own preferences" 
  ON public.user_preferences 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- Политика: Пользователь может обновлять свои настройки
CREATE POLICY "Users can update own preferences" 
  ON public.user_preferences 
  FOR UPDATE 
  USING (auth.uid() = user_id);

-- Функция и триггер для автоматического обновления поля updated_at
CREATE OR REPLACE FUNCTION update_user_preferences_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_user_preferences_updated_at_trigger ON public.user_preferences;

CREATE TRIGGER update_user_preferences_updated_at_trigger
BEFORE UPDATE ON public.user_preferences
FOR EACH ROW
EXECUTE FUNCTION update_user_preferences_updated_at();
