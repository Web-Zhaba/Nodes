# Landing Page Pricing Update Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Synchronize landing page pricing and feature descriptions with actual app limits and capabilities.

**Architecture:** Update i18n JSON files for Russian and English.

**Tech Stack:** Astro (i18n).

---

### Task 1: Update Russian Localization

**Files:**
- Modify: `nodes-landing/src/i18n/ru.json`

- [ ] **Step 1: Update Free and Pro plan features and CTA**

Replace the `pricing` section content to reflect actual limits:
- Free: Up to 10 nodes/3 cores, 30-day analytics.
- Pro: Unlimited nodes/cores, 365-day analytics, custom themes, data export.
- CTA for Pro: "Купить Pro".

- [ ] **Step 2: Commit changes**

```bash
git add nodes-landing/src/i18n/ru.json
git commit -m "feat(landing): update russian pricing and features"
```

---

### Task 2: Update English Localization

**Files:**
- Modify: `nodes-landing/src/i18n/en.json`

- [ ] **Step 1: Update Free and Pro plan features and CTA**

Replace the `pricing` section content to reflect actual limits (matching Russian version).
- CTA for Pro: "Get Pro".

- [ ] **Step 2: Commit changes**

```bash
git add nodes-landing/src/i18n/en.json
git commit -m "feat(landing): update english pricing and features"
```

---

### Task 3: Verification

- [ ] **Step 1: Launch landing page locally**
  Run `run-landing.bat`.

- [ ] **Step 2: Verify visual changes**
  Check the pricing section in both languages on `http://localhost:4321`.

---

### Task 4: Push Changes

- [ ] **Step 1: Push to origin**
```bash
git push origin main
```
