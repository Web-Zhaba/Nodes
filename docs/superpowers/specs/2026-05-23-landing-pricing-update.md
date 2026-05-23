# Landing Page Pricing Update Design (2026-05-23)

## 1. Overview
The pricing and features on the landing page (`nodes-landing`) are outdated and do not match the actual application logic (`nodes-frontend`). This design aims to align the landing page content with the current application state for both Russian and English locales.

## 2. Actual Data Mapping

### 2.1. Free Plan
- **Nodes Limit:** 10 (Landing says "Unlimited")
- **Cores Limit:** 3 (Landing says "Unlimited")
- **Analytics:** 30 days
- **Public Profile:** Included

### 2.2. Pro Plan
- **Nodes/Cores:** Unlimited
- **Analytics:** 365 days
- **Custom Themes:** Included (Landing says "Soon")
- **Data Export (JSON/CSV):** Included (Landing says "Soon")
- **Integrations:** Still "Soon" (Backend shows they are planned)
- **Status:** Active/Available (Landing CTA says "Soon")

## 3. Changes by Locale

### 3.1. Russian (`nodes-landing/src/i18n/ru.json`)
- **Free Plan Features:**
    - "Безлимитные узлы и ядра" -> "До 10 узлов и 3 ядер"
    - "Аналитика и тепловая карта" -> "Аналитика за 30 дней"
- **Pro Plan Features:**
    - "Всё из бесплатного" -> "Безлимитные узлы и ядра"
    - "Продвинутая аналитика" -> "Аналитика за 365 дней"
    - "Кастомные темы" (keep)
    - "Интеграции (скоро)" (keep)
    - Add: "Экспорт данных (JSON/CSV)"
- **CTA:**
    - "Скоро" -> "Купить Pro" (or "Начать с Pro")

### 3.2. English (`nodes-landing/src/i18n/en.json`)
- **Free Plan Features:**
    - "Unlimited nodes & cores" -> "Up to 10 nodes & 3 cores"
    - "Analytics & heatmap" -> "30-day analytics"
- **Pro Plan Features:**
    - "Everything in Free" -> "Unlimited nodes & cores"
    - "Advanced analytics" -> "365-day analytics"
    - "Custom themes" (keep)
    - "Integrations (coming soon)" (keep)
    - Add: "Data export (JSON/CSV)"
- **CTA:**
    - "Coming Soon" -> "Get Pro"

## 4. Implementation Steps
1. Update `nodes-landing/src/i18n/ru.json`.
2. Update `nodes-landing/src/i18n/en.json`.
3. Verify local rendering using `run-landing.bat`.
4. Commit and push changes.

## 5. Success Criteria
- Landing page correctly displays 10 nodes/3 cores limit for Free plan.
- Landing page correctly displays 365 days analytics and data export for Pro plan.
- Pro plan CTA is no longer "Soon".
- Both languages are updated consistently.
