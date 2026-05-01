# Interactive Node Analytics (Phase 2) Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Реализовать интерактивную страницу аналитики с возможностью глубокого погружения (drill-down) в конкретные узлы, фильтрацией данных в реальном времени и анимациями фокусировки.

**Architecture:** Мы используем «Fat Payload» подход: Django отдает полный массив данных за период, а React-фронтенд выполняет мгновенную фильтрацию через Zustand-стор `useAnalyticsStore`. Визуализация строится на Recharts с применением Framer Motion для плавных переходов.

**Tech Stack:** React, Zustand, Recharts, Framer Motion, Django (DRF).

---

### Task 1: Подготовка хранилища (Zustand)

**Files:**
- Modify: `nodes-frontend/src/store/useAnalyticsStore.ts`

**Step 1: Расширить интерфейс состояния**
Добавить `focusEntity` (тип и ID) и экшены для управления фокусом.

**Step 2: Реализовать экшены `setFocus` и `clearFocus`**
```typescript
setFocus: (type: 'node' | 'core', id: string) => set({ focusEntity: { type, id } }),
clearFocus: () => set({ focusEntity: null }),
```

**Step 3: Обновить логику `fetchData`**
Убедиться, что загруженные данные сохраняются в сыром виде для последующей фильтрации.

**Step 4: Commit**
```bash
git add nodes-frontend/src/store/useAnalyticsStore.ts
git commit -m "feat(analytics): add focus state and actions to store"
```

---

### Task 2: Реальные данные на бэкенде (Django)

**Files:**
- Modify: `nodes-backend/engine/views.py:get_analytics_history`

**Step 1: Реализовать агрегацию импульсов**
Написать SQL или ORM запрос, который возвращает историю стабильности и количество импульсов по каждому узлу пользователя за последние N дней.

**Step 2: Форматирование ответа**
JSON должен содержать массив объектов, где ключами являются ID узлов, а значениями — массивы данных по дням.

**Step 3: Проверка через Postman/Curl**
Выполнить запрос к `/api/analytics/history` и убедиться в корректности структуры.

**Step 4: Commit**
```bash
git add nodes-backend/engine/views.py
git commit -m "feat(backend): implement real analytics history aggregation"
```

---

### Task 3: Компонент управления (GlobalControlBar)

**Files:**
- Create: `nodes-frontend/src/features/analytics/components/GlobalControlBar.tsx`
- Modify: `nodes-frontend/src/pages/AnalyticsPage.tsx`

**Step 1: Создать `GlobalControlBar`**
Реализовать панель с названием текущего контекста и кнопкой «Вернуться к обычному виду» (используя Shadcn Button и Framer Motion).

**Step 2: Интеграция в `AnalyticsPage`**
Заменить старый хедер на новый компонент.

**Step 3: Commit**
```bash
git add nodes-frontend/src/features/analytics/components/GlobalControlBar.tsx nodes-frontend/src/pages/AnalyticsPage.tsx
git commit -m "ui(analytics): add GlobalControlBar with reset focus action"
```

---

### Task 4: Интерактивный график (StabilityHeroChart)

**Files:**
- Modify: `nodes-frontend/src/features/analytics/components/StabilityHeroChart.tsx`

**Step 1: Реализовать Multi-line рендеринг**
Если фокус не установлен, отрисовывать линии для всех узлов из загруженных данных.

**Step 2: Добавить эффекты Hover**
Использовать CSS-переменные или состояние для приглушения (dimming) неактивных линий при наведении.

**Step 3: Обработка клика**
Добавить `onClick` на компоненты `Line` или `Area` в Recharts для вызова `setFocus`.

**Step 4: Клик в пустоту**
Добавить обработчик клика на контейнер графика для вызова `clearFocus`.

**Step 5: Commit**
```bash
git add nodes-frontend/src/features/analytics/components/StabilityHeroChart.tsx
git commit -m "feat(analytics): implement interactive multi-line chart with focus logic"
```

---

### Task 5: Адаптивная тепловая карта (PulseHeatmap)

**Files:**
- Modify: `nodes-frontend/src/features/analytics/components/PulseHeatmap.tsx`

**Step 1: Локальная фильтрация данных**
Внутри компонента добавить `useMemo`, который фильтрует массив импульсов: если есть `focusEntity.id`, оставляем только импульсы этого узла, иначе — суммируем все.

**Step 2: Анимация смены данных**
Обеспечить плавную смену цветов ячеек при переключении фокуса (через CSS transitions).

**Step 3: Commit**
```bash
git add nodes-frontend/src/features/analytics/components/PulseHeatmap.tsx
git commit -m "feat(analytics): add local filtering to PulseHeatmap"
```
