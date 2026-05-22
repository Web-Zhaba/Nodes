# Nodes Proprietary Transition Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transition the "Nodes" project to a "Source-Visible Proprietary" model by updating the license, README, and adding copyright headers.

**Architecture:** We will replace all MIT references with Proprietary (All Rights Reserved) markers. We will create a strict LICENSE file and update the README to reflect the product's commercial nature while keeping the source code visible for transparency.

**Tech Stack:** Legal/Markdown updates, Copyright headers in Python/TypeScript.

---

### Task 1: Legal Framework - Create LICENSE File

**Files:**
- Create: `LICENSE`

- [ ] **Step 1: Create the LICENSE file with Proprietary text**

```markdown
# Proprietary License - Nodes

Copyright (c) 2026 Web-Zhaba. All rights reserved.

## 1. Ownership
The Software and all associated documentation are the exclusive property of Web-Zhaba (the "Owner").

## 2. Restrictions
You are NOT permitted to:
- Copy, redistribute, or host this software in any form, commercial or non-commercial.
- Modify or create derivative works of the software for use outside of the official platform.
- Use the software as a service or as part of a commercial offering.

## 3. Permitted Use
- You may view the source code on the official GitHub repository for educational and audit purposes only.
- No license is granted for execution, modification, or distribution.

## 4. Contributions
We do not accept Pull Requests or external contributions at this time to maintain full ownership of the intellectual property.

## 5. Official Platform
The only authorized use of this software is at the official website: https://nodes-coral.vercel.app/ (or any successor official domain).

---
BY ACCESSING THE SOURCE CODE, YOU ACKNOWLEDGE THAT YOU HAVE READ THIS LICENSE AND AGREE TO BE BOUND BY ITS TERMS.
```

- [ ] **Step 2: Commit LICENSE**

```bash
git add LICENSE
git commit -m "legal: add proprietary license"
```

---

### Task 2: Update Project Identity (README.md)

**Files:**
- Modify: `README.md`

- [ ] **Step 1: Update README.md with Proprietary notice and badges**

Replace the current badge and license section.

```markdown
# 🧠 Nodes — Трекер жизни нового поколения

> **Второй мозг** для твоих действий. Визуализируй привычки как нейронную сеть, где каждое действие влияет на другие.

[![Status](https://img.shields.io/badge/status-alpha-yellow)](https://github.com/Web-Zhaba/Nodes)
[![License](https://img.shields.io/badge/license-Proprietary-red)](LICENSE)

---

## ⚠️ Внимание: Проприетарное ПО
Данный проект является коммерческим продуктом (Micro-SaaS). Исходный код опубликован исключительно для ознакомления и прозрачности. **Использование, копирование или развертывание кода вне официального сайта ЗАПРЕЩЕНО.**

---
```

And update the License section at the bottom:

```markdown
## 📄 Лицензия

Proprietary (Все права защищены) — см. [LICENSE](LICENSE) файл.
Использование кода в коммерческих или личных целях без явного разрешения владельца запрещено.
```

- [ ] **Step 2: Remove "Quick Start" for users**

Remove the section that encourages cloning for use. Keep only a minimal section for developers/audit if needed, or remove entirely if the goal is "No usage". Since the user said "No usage outside my site", let's remove the "Quick Start" entirely or replace it with "Official Site" link.

```markdown
## 🚀 Использование

Nodes доступен только на официальном сайте:
**[nodes-coral.vercel.app](https://nodes-coral.vercel.app)**
```

- [ ] **Step 3: Commit README changes**

```bash
git add README.md
git commit -m "docs: update README to reflect proprietary status"
```

---

### Task 3: Metadata Cleanup

**Files:**
- Modify: `nodes-frontend/package.json`
- Modify: `AGENTS.md`

- [ ] **Step 1: Update package.json license**

```json
{
  "license": "UNLICENSED",
  ...
}
```

- [ ] **Step 2: Update AGENTS.md license mention if any**

Search for "MIT" in `AGENTS.md` and remove/replace.

- [ ] **Step 3: Commit metadata changes**

```bash
git add nodes-frontend/package.json AGENTS.md
git commit -m "chore: update license metadata in package.json and AGENTS.md"
```

---

### Task 4: Add Copyright Headers to Core Files

**Files:**
- Modify: `nodes-backend/engine/recommendations.py`
- Modify: `nodes-backend/engine/services.py`
- Modify: `nodes-frontend/src/features/nodes/nodeService.ts`
- Modify: `nodes-frontend/src/features/public-sharing/api/public.service.ts`

- [ ] **Step 1: Add header to Python files**

```python
# Copyright (c) 2026 Web-Zhaba. All rights reserved.
# This file is part of Nodes and is proprietary software.
```

- [ ] **Step 2: Add header to TypeScript files**

```typescript
/**
 * Copyright (c) 2026 Web-Zhaba. All rights reserved.
 * This file is part of Nodes and is proprietary software.
 */
```

- [ ] **Step 3: Commit headers**

```bash
git add nodes-backend/engine/recommendations.py nodes-backend/engine/services.py nodes-frontend/src/features/nodes/nodeService.ts nodes-frontend/src/features/public-sharing/api/public.service.ts
git commit -m "legal: add copyright headers to core logic files"
```

---

### Task 5: Final Verification

- [ ] **Step 1: Verify all MIT mentions are gone**

Run: `grep -r "MIT" .` (ignore node_modules and .git)
Expected: No hits in your own code/docs.

- [ ] **Step 2: Verify README and LICENSE exist and are correct**

Run: `ls -l README.md LICENSE`
Expected: Both files exist.

- [ ] **Step 3: Final push (if requested, but here we just commit)**
