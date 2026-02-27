# 🧠 Nodes — Трекер жизни нового поколения

> **Второй мозг** для твоих действий. Визуализируй привычки как нейронную сеть, где каждое действие влияет на другие.

[![Status](https://img.shields.io/badge/status-alpha-yellow)](https://github.com/Web-Zhaba/Nodes)
[![Stack](https://img.shields.io/badge/stack-React%20%7C%20Supabase%20%7C%20Edge%20Functions-blue)](https://github.com/Web-Zhaba/Nodes)
[![License](https://img.shields.io/badge/license-MIT-green)](LICENSE)

---

## 🎯 Философия

**Nodes** отказывается от классического понятия "привычки" в пользу **узлов** — единиц действия, связанных в единую сеть.

| Концепт | Описание | Пример |
|---------|----------|--------|
| **Node (Узел)** | Единица действия | "Бег", "Чтение", "Медитация" |
| **Core (Ядро)** | Гравитационный центр сферы жизни | "Здоровье", "Развитие" |
| **Connector (Связь)** | Семантический тег | "#спорт", "#утро" |
| **Pulse (Импульс)** | Отметка о выполнении | Галочка за сегодня |
| **Stability (Стабильность)** | Накопленный "заряд" (0-100) | Не стрик, а плавная кривая |

### Почему не стрики?

Классические стрики обнуляются при одном пропуске → демотивируют.

**Nodes** использует **экспоненциальное затухание**:
- Один пропуск не обнуляет прогресс
- Стабильность плавно "остывает"
- Перевыполнение ускоряет восстановление (Overdrive ×1.5)

---

## 🏗 Архитектура

### Hybrid Stack

```
┌─────────────────┐     ┌──────────────────┐
│   React 19      │────▶│  Supabase Auth   │
│   Vite 7        │     │  (JWT)           │
│   Zustand       │     └────────┬─────────┘
└────────┬────────┘              │
         │                       ▼
         │            ┌──────────────────┐
         │            │  Supabase DB     │
         │            │  (PostgreSQL)    │
         │            │  + RLS Policies  │
         │            └────────┬─────────┘
         │                     │
         ▼                     ▼
┌─────────────────┐     ┌──────────────────┐
│  Graph Visual   │     │  Edge Functions  │
│  (react-force-  │     │  (Stability Calc)│
│   graph-2d)     │     │  - calculate-    │
└─────────────────┘     │    stability     │
                        │  - recalculate-  │
                        │    all-stability │
                        └──────────────────┘
```

### Типы узлов

1. **Binary** — Да/Нет (фиксированный заряд)
   - Период полураспада: 7 дней
   - Пример: "Утренняя зарядка"

2. **Quantity** — Количественный (пропорционален цели)
   - Период полураспада: 5 дней
   - Пример: "Выпить 2л воды"

3. **Duration** — Длительность (накапливается через таймер)
   - Период полураспада: 10 дней
   - Пример: "Медитация 30 мин"

---

## 🚀 Быстрый старт

### Требования

- Node.js 20+
- npm или pnpm

### Установка

```bash
# Клонировать репозиторий
git clone https://github.com/Web-Zhaba/Nodes.git
cd Nodes/nodes-frontend

# Установить зависимости
npm install

# Настроить окружение (файл уже создан)
cp .env.local.example .env.local

# Запустить dev-сервер
npm run dev
```

Приложение откроется на `http://localhost:5173`

### Деплой

**Frontend:** Vercel (автоматически из GitHub)
**Backend:** Supabase (уже развёрнут)

---

## 📚 Документация

| Файл | Описание |
|------|----------|
| [`docs/QUICKSTART.md`](docs/QUICKSTART.md) | Быстрый старт разработчика |
| [`docs/ARCHITECTURE-UPDATE-v2.md`](docs/ARCHITECTURE-UPDATE-v2.md) | Детали обновления v2 |
| [`docs/plan.md`](docs/plan.md) | Roadmap проекта |
| [`docs/supabase-schema.sql`](docs/supabase-schema.sql) | SQL схема БД |
| [`docs/deploy-vercel.md`](docs/deploy-vercel.md) | Инструкция по деплою |
| [`docs/PROGRESS.md`](docs/PROGRESS.md) | Текущий прогресс |

---

## 🛠 Стек технологий

### Frontend
- **React 19** — UI библиотека
- **TypeScript 5.9** — Типизация
- **Vite 7** — Сборка
- **Zustand 5** — State management
- **Tailwind CSS v4** — Стилизация
- **Shadcn UI** — Компоненты
- **React Router** — Роутинг
- **React Hook Form + Zod** — Формы и валидация

### Backend
- **Supabase** — Auth + Database
- **PostgreSQL 17** — Основная БД
- **Edge Functions** — Логика стабильности
- **RLS Policies** — Безопасность на уровне строк

### Инфраструктура
- **Vercel** — Хостинг фронтенда
- **Supabase** — Бэкенд (eu-west-1)

---

## 📈 Roadmap

### ✅ Фаза 0: Подготовка (завершена)
- [x] Настройка проекта
- [x] Supabase БД (таблицы: nodes, cores, connectors, impulses, connections)
- [x] Edge Functions (`calculate-stability`, `recalculate-all-stability`)
- [x] TypeScript типы v2
- [x] Zustand store с CRUD операциями

### ⏳ Фаза 1: Базовый CRUD узлов (в работе)
- [x] Аутентификация (useAuth hook готов)
- [ ] Создание узла (форма с выбором типа)
- [ ] Список узлов (карточки)
- [ ] Редактирование/удаление
- [ ] Импульсы (отметка выполнения)
- [ ] Расчёт стабильности (интеграция с Edge Function)

### 🔮 Фаза 2: Визуализация графа
- [ ] react-force-graph-2d интеграция
- [ ] Drag & drop узлов
- [ ] Визуализация связей
- [ ] Zoom & pan

### 🔮 Фаза 3: Аналитика
- [ ] Дашборд со статистикой
- [ ] Графики прогресса (Recharts)
- [ ] Инсайты и рекомендации

### 🔮 Фаза 4: Запуск
- [ ] Полировка UI/UX
- [ ] Мобильная адаптивность
- [ ] Public launch

---

## 📁 Структура проекта

```
Nodes/
├── nodes-frontend/         # Основное приложение
│   ├── src/
│   │   ├── types/          # TypeScript типы (v2)
│   │   ├── store/          # Zustand stores
│   │   ├── hooks/          # Custom hooks
│   │   ├── features/       # Фичи (stability, auth...)
│   │   ├── components/     # UI компоненты (Shadcn)
│   │   ├── pages/          # Страницы
│   │   ├── widgets/        # Композитные компоненты
│   │   ├── lib/            # Утилиты (supabase, utils)
│   │   └── config/         # Конфигурация
│   ├── .env.local          # Переменные окружения
│   └── package.json
├── docs/                   # Документация
│   ├── QUICKSTART.md       # Быстрый старт
│   ├── ARCHITECTURE-UPDATE-v2.md
│   ├── plan.md             # Roadmap
│   ├── supabase-schema.sql
│   └── deploy-vercel.md
├── QWEN.md                 # Контекст проекта (System Prompt)
└── README.md               # Этот файл
```

---

## 🧪 Тестирование

```bash
# Запустить тесты
npm run test

# Запустить тесты в UI режиме
npm run test:ui
```

---

## 🤝 Вклад

Проект в стадии активной разработки. Если хочешь помочь:

1. Fork репозиторий
2. Создай ветку (`git checkout -b feature/amazing-feature`)
3. Закоммить изменения (`git commit -m 'Add amazing feature'`)
4. Запуш (`git push origin feature/amazing-feature`)
5. Открой Pull Request

---

## 📄 Лицензия

MIT — см. [LICENSE](LICENSE) файл.

---

## 📬 Контакты

- **GitHub:** https://github.com/Web-Zhaba/Nodes
- **Issues:** https://github.com/Web-Zhaba/Nodes/issues

---

## 🙏 Благодарности

- Вдохновлено **Obsidian** (связи между заметками)
- Вдохновлено **Atomic Habits** (Джеймс Клир)
- UI компоненты: **Shadcn UI**
- Иконки: **Lucide**

---

**Nodes** — это не трекер привычек. Это архитектура твоей жизни. 🧠

---

*Последнее обновление: 27 февраля 2026*
