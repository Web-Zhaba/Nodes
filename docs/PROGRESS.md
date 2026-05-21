# 📊 Nodes — Прогресс разработки

**Дата обновления:** 25 февраля 2026 г. — Технические вопросы закрыты! ✅

---

## ✅ Фаза 0: Подготовка — ЗАВЕРШЕНА (100%)

| Задача                                   | Время  | Приоритет | Статус | Примечание                         |
| ---------------------------------------- | ------ | --------- | ------ | ---------------------------------- |
| Создать GitHub репозиторий               | 30 мин | Must      | ✅     | https://github.com/Web-Zhaba/Nodes |
| Настроить React + Vite + TypeScript      | 2 часа | Must      | ✅     | React 19, Vite 7                   |
| Настроить Tailwind CSS                   | 1 час  | Must      | ✅     | Tailwind v4                        |
| Настроить Shadcn UI                      | 2 часа | Must      | ✅     | Button, Card, Input, Label         |
| Создать Supabase проект                  | 1 час  | Must      | ✅     | Проект создан                      |
| Настроить деплой на Vercel               | 1 час  | Must      | ✅     | https://www.nodes-tracker.ru       |
| Создать базовую структуру папок          | 1 час  | Must      | ✅     | FSD-lite структура                 |
| Нарисовать wireframes в Figma/Excalidraw | 3 часа | Should    | ❌     | Пропущено (некритично)             |

**Результат фазы 0:**

- ✅ Working development environment
- ✅ Деплой на Vercel: https://www.nodes-tracker.ru
- ✅ База данных готова (SQL схема подготовлена)
- ✅ Git репозиторий: https://github.com/Web-Zhaba/Nodes
- ❌ Дизайн-концепция (wireframes) — опционально

---

## ⏳ Фаза 1: Базовый CRUD узлов — В ПРОЦЕССЕ (~50%)

### Неделя 2: Аутентификация + Инфраструктура

| Задача                               | Время  | Приоритет | Статус |
| ------------------------------------ | ------ | --------- | ------ |
| Настроить React Router DOM           | 1 час  | Must      | ✅     |
| Страница входа (Login)               | 2 часа | Must      | ✅     |
| Страница регистрации (Signup)        | 2 часа | Must      | ✅     |
| Protected routes                     | 1 час  | Must      | ✅     |
| Theme toggle (light/dark)            | 1 час  | Must      | ✅     |
| Toast уведомления (Sonner)           | 1 час  | Must      | ✅     |
| Error Boundary                       | 1 час  | Must      | ✅     |
| 404 страница                         | 30 мин | Must      | ✅     |
| Layout с навигацией                  | 1 час  | Must      | ✅     |
| Настроить Vitest + Testing Library   | 1 час  | Must      | ✅     |
| Хук useAuth                          | 30 мин | Must      | ✅     |
| Редирект с /login для авторизованных | 30 мин | Must      | ✅     |
| Кнопка выхода на HomePage            | 30 мин | Must      | ✅     |
| Форма создания узла                  | 4 часа | Must      | ❌     |
| Сохранение узла в БД                 | 2 часа | Must      | ❌     |

### 📦 Установленные зависимости

```json
{
  "dependencies": {
    "@hookform/resolvers": "^5.2.2",
    "@radix-ui/react-label": "^2.1.8",
    "@radix-ui/react-slot": "^1.2.4",
    "@supabase/supabase-js": "^2.97.0",
    "class-variance-authority": "^0.7.1",
    "clsx": "^2.1.1",
    "lucide-react": "^0.575.0",
    "react": "^19.2.0",
    "react-dom": "^19.2.0",
    "react-hook-form": "^7.71.2",
    "react-router-dom": "^7.13.1",
    "sonner": "^2.0.7",
    "tailwind-merge": "^3.5.0",
    "zod": "^4.3.6",
    "zustand": "^5.0.11"
  },
  "devDependencies": {
    "@testing-library/jest-dom": "^6.9.1",
    "@testing-library/react": "^16.3.2",
    "@testing-library/user-event": "^14.6.1",
    "@types/node": "^24.10.13",
    "@types/react": "^19.2.7",
    "@types/react-dom": "^19.2.3",
    "@vitejs/plugin-react": "^5.1.1",
    "@vitest/ui": "^4.0.18",
    "autoprefixer": "^10.4.24",
    "eslint": "^9.39.1",
    "jsdom": "^28.1.0",
    "postcss": "^8.5.6",
    "tailwindcss": "^4.2.1",
    "typescript": "~5.9.3",
    "vite": "^7.3.1",
    "vitest": "^4.0.18"
  }
}
```

### 📁 Структура проекта

```
nodes-frontend/
├── src/
│   ├── components/      # UI компоненты
│   │   ├── ui/          # Shadcn: Button, Card, Input, Label
│   │   ├── ErrorBoundary.tsx
│   │   └── ThemeToggle.tsx
│   ├── config/          # Конфигурация приложения
│   ├── hooks/           # Custom hooks (useTheme)
│   ├── lib/             # Утилиты (supabase, utils)
│   ├── pages/           # Страницы
│   │   ├── HomePage.tsx
│   │   ├── LoginPage.tsx
│   │   ├── SignupPage.tsx
│   │   └── NotFoundPage.tsx
│   ├── store/           # Zustand stores
│   ├── tests/           # Тесты (Vitest)
│   ├── types/           # TypeScript типы
│   ├── widgets/         # Композитные компоненты
│   │   ├── Layout.tsx
│   │   └── ProtectedRoute.tsx
│   └── App.tsx
├── .env.local           # ✅ Заполнен
├── docs/
│   ├── plan.md          # ✅ Roadmap
│   ├── supabase-schema.sql  # ✅ Готово
│   └── PROGRESS.md      # ✅ Этот файл
└── QWEN.md              # ✅ Контекст проекта
```

---

## 🗺️ Общая карта прогресса

```
Фаза 0: Подготовка          ✅ 100% (ЗАВЕРШЕНА)
    │
    ▼
Фаза 1: CRUD узлов          ⏳ 40% (В ПРОЦЕССЕ)
    │
    ▼
Фаза 2: Визуализация сети   ❌ 0%
    │
    ▼
Фаза 3: Аналитика           ❌ 0%
    │
    ▼
Фаза 4: Полировка и запуск  ❌ 0%
    │
    ▼
🚀 MVP ЗАПУЩЕН
```

---

## 🎯 Следующие задачи — Фаза 1 (продолжение)

1. **Форма создания узла** — поля: название, описание, категория, частота
2. **Сохранение в Supabase** — CRUD операции с узлами
3. **Список узлов** — отображение всех узлов пользователя
4. **Редактирование/удаление** — update/delete узлы
5. **Импульсы** — отметка выполнения + стрики

---

## 📝 Заметки

- Dev-сервер: `http://localhost:5173`
- Vercel деплой: https://www.nodes-tracker.ru
- Тесты: `npm run test` или `npm run test:ui`
- Все зависимости установлены ✅

---

## ✅ Закрытые технические вопросы

| Вопрос                       | Решение                                             | Статус    |
| ---------------------------- | --------------------------------------------------- | --------- |
| ESLint: setState в useEffect | Переписал на `useCallback` + эффект с зависимостями | ✅        |
| ESLint: button.tsx экспорты  | Добавил `eslint-disable` для Shadcn UI              | ✅        |
| Zustand v5 синтаксис         | Использовал `create<T>()()`                         | ✅        |
| Vitest config                | Вынес в отдельный `vitest.config.ts`                | ✅        |
| CheckSupabasePage не нужен   | Удалил (выполнял отладочную роль)                   | ✅        |
| Нет хука для аутентификации  | Создал `useAuth`                                    | ✅        |
| Нет редиректа с /login       | Добавил `AuthRedirect` компонент                    | ✅        |
| Выход из системы             | Добавил кнопку на HomePage с toast                  | ✅        |
| Большой бандл (>500KB)       | Требуется code splitting                            | ⏳ Фаза 4 |

---

## 🎨 Дизайн-система

### Цветовая схема

| Переменная     | Светлая тема      | Тёмная тема              |
| -------------- | ----------------- | ------------------------ |
| `--primary`    | Фиолетовый (286°) | Светло-фиолетовый (291°) |
| `--background` | Почти белый       | Тёмно-синий              |
| `--accent`     | Светло-фиолетовый | Насыщенный фиолетовый    |

**Характеристики:**

- **Акцент:** Фиолетовый (нейросеть/киберпанк)
- **Шрифты:** Plus Jakarta Sans, Lora, IBM Plex Mono
- **Скругления:** 1.4rem (современный вид)
- **Темы:** Тёмная по умолчанию
