# Django Admin Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Enable and configure the Django Admin panel for user management and administrative tasks.

**Architecture:** Update the existing `Profile` model to ensure it aligns with administrative requirements, register it in the admin site with custom actions, and secure the admin access via a custom URL path.

**Tech Stack:** Django 6.0, Python 3.12, PostgreSQL (shared with Supabase).

---

### Task 1: Verify and Update Profile Model

**Files:**
- Modify: `nodes-backend/engine/models.py`

- [ ] **Step 1: Verify the `Profile` model fields**
The `Profile` model already exists with the required fields: `id`, `email`, `is_pro`, `pro_expires_at`, `subscription_plan`.

- [ ] **Step 2: Ensure `managed = False` is set**
The `Profile` model already has `managed = False` and `db_table = 'profiles'`.

### Task 2: Register Profile in Django Admin

**Files:**
- Modify: `nodes-backend/engine/admin.py`

- [ ] **Step 1: Register `Profile` with custom configuration**

```python
from django.contrib import admin
from django.utils import timezone
from datetime import timedelta
from .models import Profile

@admin.register(Profile)
class ProfileAdmin(admin.ModelAdmin):
    list_display = ('id', 'email', 'is_pro', 'pro_expires_at', 'subscription_plan', 'created_at')
    search_fields = ('email', 'id')
    list_filter = ('is_pro', 'subscription_plan')
    actions = ['grant_30_days_pro']

    @admin.action(description="Grant 30 days of Pro status")
    def grant_30_days_pro(self, request, queryset):
        new_expiry = timezone.now() + timedelta(days=30)
        updated = queryset.update(
            is_pro=True,
            subscription_plan='pro',
            pro_expires_at=new_expiry
        )
        self.message_user(request, f"Granted Pro to {updated} profiles.")
```

- [ ] **Step 2: Verify syntax**
Check for any missing imports or typos.

### Task 3: Secure Django Admin URL

**Files:**
- Modify: `nodes-backend/config/urls.py`

- [ ] **Step 1: Update the admin URL path**

```python
from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path('nodes-mgmt-console/', admin.site.urls),
    path('api/v1/', include('engine.urls')),
]
```

- [ ] **Step 2: Verify the change**
Ensure the old `admin/` path is removed.

### Task 4: Final Verification

- [ ] **Step 1: Run Django check**
Run: `python manage.py check` in `nodes-backend` directory.
Expected: System check identified no issues (0 silenced).

- [ ] **Step 2: Commit changes**

```bash
git add nodes-backend/engine/admin.py nodes-backend/config/urls.py
git commit -m "feat: implement django admin with custom profile management"
```
