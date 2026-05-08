# Nodes Production Deployment Guide

Этот документ содержит шаги, необходимые для успешного запуска проекта **Nodes** в режиме production.

## 1. Настройка Frontend (Vercel / Netlify)

### Переменные окружения
При деплое фронтенда (на Vercel, Netlify или свой сервер) обязательно установите следующие переменные:
- `VITE_SUPABASE_URL`: URL вашего проекта Supabase.
- `VITE_SUPABASE_ANON_KEY`: Анонимный ключ вашего проекта.

### Сборка
Команда для сборки: `npm run build`. 
Папка вывода: `dist`.

---

## 2. Настройка Supabase (Production)

### Аутентификация (Auth Settings)
Перейдите в **Authentication → URL Configuration**:
1. **Site URL**: Установите URL вашего развернутого фронтенда (например, `https://nodes-app.vercel.app`).
2. **Redirect URLs**: Добавьте URL колбэка: `https://nodes-app.vercel.app/auth/callback`.

### OAuth (Google / GitHub)
Если вы используете вход через соцсети:
1. В консоли Google/GitHub укажите новый Redirect URI, который выдал Supabase.
2. Убедитесь, что в Supabase включен режим "External Provider".

---

## 3. Настройка Backend (Django)

### Безопасность
1. Установите `DEBUG = False` в `settings.py`.
2. Сгенерируйте новый `SECRET_KEY`.
3. Настройте `ALLOWED_HOSTS` (добавьте домен бэкенда).

### База данных
Убедитесь, что Django подключен к Supabase PostgreSQL через `DIRECT_URL` (порт 5432) или через Transaction Pooler (порт 6543) с использованием Service Role ключа, если требуется обход RLS.

---

## 4. Чек-лист перед запуском

- [ ] Выполнены все миграции в Supabase (`docs/supabase-schema.sql`).
- [ ] RLS политики настроены для всех таблиц.
- [ ] Email-шаблоны в Supabase Auth настроены (ссылки ведут на рабочий домен).
- [ ] Пройдена проверка `npm run build` без ошибок TypeScript.
- [ ] Настроены CORS в Django для приема запросов от фронтенда.

---

## 5. Мониторинг

Используйте встроенные дашборды Supabase и логи Vercel для отслеживания ошибок в реальном времени.
