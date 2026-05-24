# Nodes VPS Migration & Admin Panel Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Migration of the Nodes project to a self-hosted VPS using Coolify, including the implementation of a Django-based Admin Panel for user and subscription management.

**Architecture:** Coolify as a PaaS layer, Traefik as a reverse proxy, Slim Supabase stack (Postgres, Auth, PostgREST), and Django backend with Admin enabled.

**Tech Stack:** Coolify, Docker, PostgreSQL, Django 6.0, Python 3.12.

---

### Task 1: Initial Server Access & DNS Setup
**Files:**
- Modify: DNS Records at Domain Registrar

- [ ] **Step 1: Verify server access**
Run: `ssh root@[VPS_IP]`
Expected: Successful login to a clean Ubuntu shell.

- [ ] **Step 2: Configure DNS A-records**
Point the following to `[VPS_IP]`:
- `nodes-tracker.ru`
- `api.nodes-tracker.ru` (for Django/Admin)
- `db.nodes-tracker.ru` (for Supabase Auth/API)
- `coolify.nodes-tracker.ru` (optional, for the panel itself)

- [ ] **Step 3: Verify DNS propagation**
Run: `nslookup api.nodes-tracker.ru`

---

### Task 2: Coolify Setup & Supabase Deployment
**Files:**
- Create: `supabase-slim.yml` (Docker Compose for Coolify)

- [ ] **Step 1: Complete Coolify installation and onboarding**
Access `http://[VPS_IP]:3000`, set up the admin account, and configure the main domain.

- [ ] **Step 2: Create a "Project" in Coolify for Nodes**

- [ ] **Step 3: Deploy Slim Supabase Stack**
Use a custom Docker Compose based on the "Slim" architecture.
Key services: `db`, `auth`, `rest`, `kong`.
Set `POSTGRES_PASSWORD`, `JWT_SECRET`, `ANON_KEY`, `SERVICE_ROLE_KEY` in Coolify Environment Variables.

- [ ] **Step 4: Verify Supabase health**
Check `https://db.nodes-tracker.ru/health`

---

### Task 3: Data Migration from Cloud Supabase
**Files:**
- Create: `migration_dump.sql`

- [ ] **Step 1: Export schema and data from Cloud Supabase**
Run: `pg_dump --clean --if-exists "postgresql://postgres:[PASSWORD]@db.[PROJECT].supabase.co:5432/postgres" > migration_dump.sql`

- [ ] **Step 2: Import data to VPS Postgres**
Connect to the new Postgres instance via Coolify or CLI and execute the dump.
Run: `cat migration_dump.sql | docker exec -i [POSTGRES_CONTAINER_ID] psql -U postgres`

---

### Task 4: Django Admin Implementation
**Files:**
- Modify: `nodes-backend/engine/models.py` (Add/Update models for existing tables)
- Modify: `nodes-backend/engine/admin.py` (Register models)
- Modify: `nodes-backend/config/urls.py` (Enable admin path)

- [ ] **Step 1: Define Models with `managed = False`**
```python
from django.db import models

class Profile(models.Model):
    id = models.UUIDField(primary_key=True)
    email = models.EmailField(unique=True)
    is_pro = models.BooleanField(default=False)
    pro_expires_at = models.DateTimeField(null=True, blank=True)
    subscription_plan = models.CharField(max_length=50, default='free')

    class Meta:
        managed = False
        db_table = 'profiles'
```

- [ ] **Step 2: Register Models in Admin**
```python
from django.contrib import admin
from .models import Profile

@admin.register(Profile)
class ProfileAdmin(admin.ModelAdmin):
    list_display = ('email', 'is_pro', 'pro_expires_at', 'subscription_plan')
    search_fields = ('email',)
    actions = ['grant_30_days_pro']

    @admin.action(description="Grant 30 Days Pro")
    def grant_30_days_pro(self, request, queryset):
        from django.utils import timezone
        from datetime import timedelta
        queryset.update(is_pro=True, pro_expires_at=timezone.now() + timedelta(days=30), subscription_plan='pro')
```

- [ ] **Step 3: Enable Admin URL**
```python
from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path('nodes-mgmt-console/', admin.site.urls), # Secret path
    path('api/v1/', include('engine.urls')),
]
```

---

### Task 5: Deploy Django Backend to Coolify
**Files:**
- Create: `Dockerfile` in `nodes-backend/`

- [ ] **Step 1: Create Dockerfile for Django**
```dockerfile
FROM python:3.12-slim
WORKDIR /app
RUN apt-get update && apt-get install -y libpq-dev gcc
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY . .
CMD ["gunicorn", "--bind", "0.0.0.0:8000", "config.wsgi:application"]
```

- [ ] **Step 2: Connect GitHub Repository to Coolify**
Set up the backend service to deploy from the `nodes-backend` folder.

- [ ] **Step 3: Configure Environment Variables in Coolify**
`DATABASE_URL`, `SECRET_KEY`, `ALLOWED_HOSTS=api.nodes-tracker.ru`, `DEBUG=False`.

- [ ] **Step 4: Create Django Superuser**
Run via Coolify Debug Terminal or SSH:
`docker exec -it nodes-django python manage.py createsuperuser`

---

### Task 6: Frontend Update & Verification
**Files:**
- Modify: Vercel Environment Variables

- [ ] **Step 1: Update Vercel Env Vars**
Update `VITE_SUPABASE_URL` to `https://db.nodes-tracker.ru` and `VITE_DJANGO_API_URL` to `https://api.nodes-tracker.ru/api/v1`.

- [ ] **Step 2: Final Integration Test**
Log in to the app, perform an action, verify data in Django Admin.
