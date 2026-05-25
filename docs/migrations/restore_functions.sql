-- SQL Скрипт для восстановления функций импульсов в self-hosted Supabase
-- Выполнить в SQL Editor или через psql -U postgres

-- 0. Удаляем старые версии функций (необходимо для изменения параметров по умолчанию)
DROP FUNCTION IF EXISTS public.save_node_progress(uuid, numeric, date, boolean);
DROP FUNCTION IF EXISTS public.cancel_node_progress(uuid, date);

-- 1. Функция сохранения прогресса (импульса)
CREATE OR REPLACE FUNCTION public.save_node_progress(
  p_node_id uuid, 
  p_value numeric, 
  p_date date, 
  p_is_incremental boolean
) 
RETURNS void 
LANGUAGE plpgsql 
SECURITY DEFINER
AS $$
BEGIN
  IF p_is_incremental THEN
    INSERT INTO public.impulses (node_id, value, completed_at, created_at)
    VALUES (p_node_id, p_value, p_date, now());
  ELSE
    -- Для обычных нод обновляем значение, если на этот день уже есть импульс
    INSERT INTO public.impulses (node_id, value, completed_at, created_at)
    VALUES (p_node_id, p_value, p_date, now())
    ON CONFLICT (node_id, completed_at) 
    DO UPDATE SET value = EXCLUDED.value, created_at = now();
  END IF;
END;
$$;

-- 2. Функция отмены прогресса
CREATE OR REPLACE FUNCTION public.cancel_node_progress(
  p_node_id uuid, 
  p_date date
) 
RETURNS void 
LANGUAGE plpgsql 
SECURITY DEFINER
AS $$
BEGIN
  DELETE FROM public.impulses 
  WHERE node_id = p_node_id AND completed_at = p_date;
END;
$$;

COMMENT ON FUNCTION public.save_node_progress IS 'Создает или обновляет импульс для ноды.';
COMMENT ON FUNCTION public.cancel_node_progress IS 'Удаляет импульс для ноды за указанную дату.';
