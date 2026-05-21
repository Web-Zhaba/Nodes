# 📖 GUIDES: Инструкции по Nodes

## 🚀 Быстрый запуск (Локально)

### 1. Установка зависимостей
```bash
cd nodes-frontend
npm install
```

### 2. Переменные окружения (`.env.local`)
Проверь наличие ключей доступа к Supabase:
```env
VITE_SUPABASE_URL=https://...
VITE_SUPABASE_ANON_KEY=eyJ...
```

### 3. Запуск dev-сервера
```bash
npm run dev
```
Доступно на `http://localhost:5173`.

---

## 🌍 Деплой на Vercel

### Автоматический деплой
Приложение настроено на автоматический деплой при пуше в ветку `main`.
- **URL проекта:** https://www.nodes-tracker.ru/
- **CI/CD:** GitHub Actions (опционально) или Vercel Git Integration.

### Настройка Environment Variables в Vercel
Убедись, что переменные из `.env.local` добавлены в панель управления Vercel (Project Settings -> Environment Variables).

---

## 🧪 Тестирование Edge Functions

Если тебе нужно вручную вызвать пересчёт стабильности:
```bash
# Через curl (нужен JWT токен)
curl -X POST 'https://[ID].supabase.co/functions/v1/recalculate-all-stability' \
  -H 'Authorization: Bearer YOUR_JWT_TOKEN'
```

---

## 🛠 Обслуживание БД
Вся схема данных находится в `docs/SCHEMA.sql`. При изменениях в БД:
1. Создай миграцию или примени SQL через Supabase Dashboard.
2. Обнови TypeScript типы в `src/types`.
