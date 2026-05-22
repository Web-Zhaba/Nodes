# Nodes — Трекер привычек нового поколения

> **Nodes** — персональный трекер привычек с визуализацией в виде сети взаимосвязанных узлов.

## 🎯 Концепция

Вместо классического списка привычек Nodes представляет вашу жизнь как **нейронную сеть**:
- **Узел (Node)** — единица действия (привычка)
- **Связь (Connector)** — взаимовлияние между узлами
- **Импульс (Pulse)** — отметка о выполнении
- **Стабильность (Stability)** — длина стрика

## 🚀 Быстрый старт

### Требования
- Node.js 18+
- npm или pnpm
- Аккаунт на [Supabase](https://supabase.com)

### Установка

```bash
# Клонирование репозитория
git clone <your-repo-url>
cd nodes-frontend

# Установка зависимостей
npm install

# Настройка окружения
cp .env.local.example .env.local
# Отредактируйте .env.local, добавив ключи Supabase

# Запуск разработки
npm run dev
```

### Настройка Supabase

1. Создайте проект на [supabase.com](https://supabase.com)
2. Получите API ключи в Settings → API
3. Вставьте их в `.env.local`
4. Выполните SQL из `docs/supabase-schema.sql` в SQL Editor

Подробная инструкция в [SETUP.md](./SETUP.md)

## 📁 Структура проекта

```
nodes-frontend/
├── src/
│   ├── components/     # UI компоненты (Shadcn)
│   ├── entities/       # Бизнес-сущности
│   ├── features/       # Фичи
│   ├── widgets/        # Композитные компоненты
│   ├── pages/          # Страницы
│   ├── store/          # Zustand stores
│   ├── types/          # TypeScript типы
│   ├── hooks/          # Custom hooks
│   ├── config/         # Конфигурация
│   └── lib/            # Утилиты
├── docs/
│   ├── plan.md         # Roadmap проекта
│   └── supabase-schema.sql
└── package.json
```

## 🛠 Технологический стек

| Категория | Технологии |
|-----------|------------|
| **Frontend** | React 18, TypeScript, Vite |
| **Стили** | Tailwind CSS, Shadcn UI |
| **Состояние** | Zustand |
| **Backend** | Supabase (PostgreSQL + Auth) |
| **Валидация** | Zod, React Hook Form |

## 📦 Доступные команды

```bash
npm run dev      # Запуск dev-сервера (http://localhost:5173)
npm run build    # Production сборка
npm run preview  # Preview production версии
npm run lint     # ESLint проверка
```

## 🗺 Roadmap

| Фаза | Описание | Статус |
|------|----------|--------|
| **Фаза 0** | Подготовка окружения | ✅ В процессе |
| **Фаза 1** | Базовый CRUD узлов | ⏳ Ожидает |
| **Фаза 2** | Визуализация сети | ⏳ Ожидает |
| **Фаза 3** | Аналитика и статистика | ⏳ Ожидает |
| **Фаза 4** | Полировка и запуск | ⏳ Ожидает |

Подробная дорожная карта в [docs/plan.md](./docs/plan.md)

## 📄 Лицензия

Proprietary

---

*Проект создаётся соло-разработчиком. Follow the journey.*
