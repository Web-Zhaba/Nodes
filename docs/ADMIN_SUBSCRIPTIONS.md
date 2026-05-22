# Ручное управление подписками (Admin Tools)

Этот документ содержит SQL-скрипты для ручного управления статусами пользователей, выдачи Pro-подписок и регулирования их длительности.

## 1. Установка административной функции

Выполните этот скрипт **один раз** в [Supabase SQL Editor](https://supabase.com/dashboard/project/_/sql), чтобы создать вспомогательную функцию.

```sql
-- Функция для удобного управления подпиской по Email
CREATE OR REPLACE FUNCTION public.manage_user_subscription(
  target_user_email TEXT,
  target_plan TEXT DEFAULT 'pro',
  duration_days INTEGER DEFAULT 30,
  is_active BOOLEAN DEFAULT true
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER -- Выполняется от имени суперпользователя
AS $$
DECLARE
  target_user_id UUID;
  new_expiry TIMESTAMPTZ;
BEGIN
  -- 1. Находим пользователя по email в таблице profiles
  SELECT id INTO target_user_id FROM public.profiles WHERE email = target_user_email;
  
  IF target_user_id IS NULL THEN
    RETURN jsonb_build_object(
      'status', 'error',
      'message', 'User with email ' || target_user_email || ' not found in public.profiles'
    );
  END IF;

  -- 2. Рассчитываем дату окончания
  IF is_active THEN
    -- Добавляем указанное количество дней к текущему времени
    new_expiry := now() + (duration_days || ' days')::INTERVAL;
  ELSE
    -- Устанавливаем дату в прошлом для мгновенной деактивации
    new_expiry := now() - INTERVAL '1 second';
  END IF;

  -- 3. Обновляем данные в таблице профилей
  UPDATE public.profiles
  SET 
    is_pro = is_active,
    pro_expires_at = new_expiry,
    subscription_plan = target_plan,
    updated_at = now()
  WHERE id = target_user_id;

  RETURN jsonb_build_object(
    'status', 'success',
    'user_id', target_user_id,
    'email', target_user_email,
    'plan', target_plan,
    'expires_at', new_expiry,
    'is_pro', is_active
  );
END;
$$;

COMMENT ON FUNCTION public.manage_user_subscription IS 'Административная функция для ручной выдачи или отзыва Pro-статуса пользователя по его email.';
```

---

## 2. Использование (Примеры команд)

После установки функции используйте следующие команды для управления доступом:

### Выдать стандартный Pro (30 дней)
```sql
SELECT manage_user_subscription('user@example.com', 'pro', 30);
```

### Выдать Pro на год (365 дней)
```sql
SELECT manage_user_subscription('friend@nodes.app', 'pro', 365);
```

### Выдать «Вечную» подписку (на 100 лет)
```sql
SELECT manage_user_subscription('admin@nodes.app', 'pro', 36500);
```

### Отозвать подписку (сбросить в Free)
```sql
SELECT manage_user_subscription('user@example.com', 'free', 0, false);
```

---

## 3. Как проверить текущий статус
Чтобы посмотреть список всех Pro-пользователей и сроки действия их подписок:

```sql
SELECT email, is_pro, subscription_plan, pro_expires_at 
FROM public.profiles 
WHERE is_pro = true 
ORDER BY pro_expires_at DESC;
```
