-- ============================================================
-- Migration 005: Monetization (Subscription & Pro Plan)
-- Применить в Supabase SQL Editor
-- ============================================================

-- 1. Новые колонки в таблице profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS is_pro            BOOLEAN         DEFAULT false,
  ADD COLUMN IF NOT EXISTS pro_expires_at    TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS subscription_plan TEXT            DEFAULT 'free',
  ADD COLUMN IF NOT EXISTS payment_id        TEXT;           -- ID платежа (ЮКасса, будет заполнен позже)

-- 2. Индекс для быстрой проверки Pro-статуса (используется в RLS и Django)
CREATE INDEX IF NOT EXISTS idx_profiles_is_pro ON public.profiles(is_pro);

-- 3. RLS: Django (service role) может обновлять статус подписки
-- Существующая политика "Users can update own profile" покрывает SELECT/UPDATE через anon/user.
-- Service role обходит RLS автоматически — дополнительных политик не нужно.

-- 4. Проверочное ограничение: subscription_plan может быть только 'free' или 'pro'
ALTER TABLE public.profiles
  ADD CONSTRAINT chk_subscription_plan
  CHECK (subscription_plan IN ('free', 'pro'));

-- 5. Хелпер-функция: проверить, является ли текущий пользователь Pro
-- Используется в будущих RLS-политиках ограничения данных
CREATE OR REPLACE FUNCTION public.is_pro_user()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT COALESCE(
    (
      SELECT is_pro FROM public.profiles
      WHERE id = (SELECT auth.uid())
        AND (pro_expires_at IS NULL OR pro_expires_at > now())
    ),
    false
  )
$$;

-- 6. Обновить существующих пользователей — убедиться, что у всех стоит 'free'
UPDATE public.profiles
SET subscription_plan = 'free'
WHERE subscription_plan IS NULL;

-- ============================================================
-- Результат: таблица profiles теперь содержит:
--   is_pro            BOOLEAN  — активна ли Pro-подписка
--   pro_expires_at    TIMESTAMPTZ — до какой даты активна
--   subscription_plan TEXT     — 'free' | 'pro'
--   payment_id        TEXT     — для будущей интеграции с ЮКассой
-- ============================================================
