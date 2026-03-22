# 🗺️ ROADMAP & PROGRESS: Nodes

## 📊 Текущий статус: Фаза 3 (В процессе)
**Общий прогресс:** ~80% к MVP.

---

## ✅ Фаза 0: Подготовка (100%)
- [x] Окружение: React + TS + Tailwind v4 + Shadcn.
- [x] Инфраструктура: Supabase Auth & DB Schema v2.
- [x] Деплой: Vercel CI/CD.

## ✅ Фаза 1: Базовый CRUD узлов (100%)
- [x] Аутентификация (Login/Signup/Protected Routes).
- [x] Создание узлов (все типы: binary, quantity, duration).
- [x] Множественные коннекторы (junction-table).
- [x] Список узлов (карточки с контролями выполнения).
- [x] Импульсы и счётчики (Атомарный `save_node_progress` RPC).
- [x] Редактирование и удаление узлов (UI).
- [x] Dashboard (Weekly Calendar, Daily Focus, Capacity UI).

## ✅ Этап: Глубокая Оптимизация 1.0 (100%)
- [x] Батчинг запросов (решена проблема N+1).
- [x] Атомарные транзакции и синхронный стейт (Zustand: защита от Race Conditions).
- [x] Code Splitting, Resource Hints, Локальные шрифты.
- [x] GPU-акселерация анимаций (Framer Motion).

## ✅ Этап: Архитектурные Реформы (100%)
- [x] Миграция на **React Query (TanStack Query)**: автоматическое управление кэшем и серверным состоянием.
- [x] Нормализация данных (O(1) доступ) и рефакторинг Zustand (теперь только для UI).
- [x] Структуризация по **FSD (Feature-Sliced Design)**: перенос логики в Entities и Features.
- [x] Оптимистичные обновления и синхронизация кэша.

## ✅ Фаза 2: Визуализация графа и Cores (100%)
- [x] Создание Ядер (Cores) и MOC логика (связь через теги).
- [x] Интеграция `react-force-graph-2d`.
- [x] Отображение узлов как гравитационной сети вокруг Cores.
- [x] Адаптивность графа (Mobile Sidebar / Sheet / Auto-zoom).
- [x] Динамическая цветовая схема (Theme-aware labels & nodes).
- [x] Drag & Drop узлов.
- [ ] Визуализация связей (яркость = текущий прогресс/стабильность). ← *Следующий шаг*

## ✅ Фаза 3: Django Logic Engine (100% — завершено в марте 2026)

### Backend (Django + DRF)
- [x] Создание Django-проекта (`nodes-backend`), подключение к Supabase PostgreSQL.
- [x] Модели Django (`managed=False`) зеркалят схему Supabase: `Node`, `Core`, `Connector`, `NodeConnector`, `CoreConnector`, `Impulse`, `Profile`.
- [x] **Кастомная JWT-аутентификация** (`SupabaseJWTAuthentication`):
  - Поддержка алгоритмов `ES256` и `HS256`.
  - Автоматическая загрузка и кэширование JWKS от Supabase (`/auth/v1/.well-known/jwks.json`).
  - Полная верификация подписи токена.
- [x] **Logic Engine** (`engine/services.py`):
  - `calculate_pulse_impact`: учёт недовыполнения (пропорциональный импульс) и Overdrive (бонус до 150%).
  - `recalculate_node_stability`: экспоненциальное остывание (decay 5%/день), окно 30 дней.
  - `update_user_network_stability`: парциальный пересчёт (только один узел + связанные ядра) или полный пересчёт сети.
  - `recalculate_core_stability`: агрегирование через `CoreConnector → Connector → NodeConnector → Node`.
- [x] **REST API** (`POST /api/v1/stability/calculate/`): принимает `node_id` для точечного пересчёта.
- [x] **Рефакторинг бэкенда**:
  - `prefetch_related` для импульсов (с N+1 до 2 SQL-запросов при полном пересчёте).
  - История импульсов ограничена 30 днями.
  - Все `print()` заменены на `logging` с конфигурацией в `settings.py`.
  - `requests` добавлен в зависимости для JWKS-запросов.

### Frontend-интеграция
- [x] `src/lib/djangoApi.ts`: функция `calculateStability(nodeId?)` с `AbortController` (таймаут 10с).
- [x] `NodesListPage.tsx`: дебаунсированный вызов Django (800ms) после каждого импульса.
- [x] Авто-пересчёт при загрузке страницы (полный) + точечный пересчёт при клике.
- [x] `queryClient.invalidateQueries` после успешного расчёта обновляет UI.

## 📅 Фаза 3 (продолжение): Аналитика (Апрель 2026)
- [ ] **Визуализация стабильности на графе** (яркость рёбер = stability_score ядра).
- [ ] Дашборд со статистикой ядер.
- [ ] Графики активности (Recharts).
- [ ] Инсайты по "остывающим" узлам.

## 📅 Фаза 4: Управление делами (Inbox)
- [ ] Автономная страница Inbox (Daily Tasks).
- [ ] Система дедлайнов (Cycle Ends) и авто-переноса задач.
- [ ] Impact Levels (приоритеты) для задач.
- [ ] Логирование выполненных дел.

## 📅 Фаза 5: Персонализация и Интеграции
- [ ] **Theming 2.0:** Полная настройка цветовых палитр для Light/Dark тем (CSS Variables).
- [ ] **Глубокая локализация:** Поддержка i18next, адаптация форматов дат/времени и таймзон.
- [ ] **Account Management:** Смена Email/Password, привязка Social Providers (Oauth), управление сессиями.
- [ ] **External Sync:** Двусторонняя интеграция с Google Calendar (авто-импульсы из событий).
- [ ] **Notifications:** Настройка уведомлений по каналам (Browser, Email, Telegram).

---

## 📝 Технический долг и баг-трекер
| Задача | Приоритет | Статус |
|--------|-----------|--------|
| Вынос всех строк в `en.json/ru.json` (подготовка i18n) | Средний | ⏳ Ожидает |
| Оптимизация бандла (Code Splitting) | Низкий | ✅ Завершено |
| Защита от потери стейта (Race Conditions) | Критичный | ✅ Исправлено |
| Полное покрытие Unit-тестами | Средний | 30% (CRUD & Stores ✅) |
| Мобильная адаптивность графа | Высокий | ✅ Завершено (Sidebar Sheet) |
| Безопасный режим JWT (ES256 + JWKS) | Критичный | ✅ Завершено |
| Оптимизация запросов к Impulses (prefetch) | Средний | ✅ Завершено |
| Продакшн-деплой Django бэкенда | Высокий | ⏳ Ожидает |

---

## 🎯 Метрики проекта
- **Количество таблиц:** 9 (+ `node_connectors`, `core_connectors`)
- **RLS политики:** 28
- **Компонентов:** 25+
- **Размер бандла:** ~420 KB (Gzipped)
- **Django endpoints:** 1 (`/api/v1/stability/calculate/`)
- **Суммарный стек:** React + Vite + TS + Supabase + Django DRF
