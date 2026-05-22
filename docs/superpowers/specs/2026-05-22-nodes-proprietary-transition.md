# Design: Transitioning Nodes to Source-Visible Proprietary SaaS

**Date:** 2026-05-22
**Status:** Pending Approval
**Owner:** Web-Zhaba

## 1. Purpose
The goal is to transition the "Nodes" project from a public open-source (MIT-style) repository to a proprietary Micro-SaaS model. The code will remain visible on GitHub for transparency and portfolio purposes, but all rights will be reserved to prevent any unauthorized use, hosting, or modification outside the official platform.

## 2. Legal Framework
A new `LICENSE` file will be created at the root of the repository.

### License Content:
- **Ownership:** Web-Zhaba.
- **Restrictions:** 
    - No copying, distribution, or modification of the software.
    - No commercial or non-commercial use outside of the official website.
    - Viewing the source code on the official repository for educational purposes is the only permitted action.
- **Pull Requests:** Explicitly stated that contributions are not accepted to maintain full ownership.

## 3. README.md Updates
The `README.md` will be overhauled to reflect the product status.

### Changes:
- **License Badge:** Update to `License: Proprietary` (Red).
- **Hero Section:** Add a clear "Proprietary Notice" at the top.
- **Quick Start:** Remove instructions for local setup for users. Keep a minimal section for "Code Exploration" if necessary, but frame it as "for audit purposes only".
- **Contribution Section:** Replace with a statement that PRs are not accepted.
- **Link to Production:** Ensure the link to the official site is prominent.

## 4. Source Code Headers
Add copyright headers to the following high-value files to reinforce ownership:
- `nodes-backend/engine/recommendations.py` (or equivalent core logic)
- `nodes-frontend/src/features/stability/` (core hooks/services)
- Supabase Edge Functions.

## 5. Technical Cleanup
- Ensure no sensitive environment variables or secrets are in the commit history (already a standard practice).
- Check `package.json` and `AGENTS.md` for any remaining "MIT" references and update them to "Proprietary".

## 6. Success Criteria
- The repository clearly signals its proprietary status to any visitor.
- The `LICENSE` file is present and unambiguous.
- The `README.md` focuses on the product rather than the open-source "template" nature.

---
**Approval Gate:** Please review this design. Once approved, I will proceed with the implementation.
