# Specification: Nodes Admin Panel (Django-based)

**Status:** Draft
**Date:** 2026-05-24
**Author:** Gemini CLI

## 1. Overview
The goal is to provide a robust administrative interface for the Nodes project to replace manual SQL operations. The solution leverages the existing Django backend to provide a web-based UI for user management, subscription control, and system analytics.

## 2. Objectives
*   **User Management:** Replace manual SQL scripts for managing Pro subscriptions.
*   **Data Control:** Provide CRUD (Create, Read, Update, Delete) operations for Nodes, Pulses, and Profiles.
*   **Analytics:** Visualize system health and user activity without relying on external cloud analytics.
*   **Security:** Isolate administrative access from the main user application.

## 3. Architecture
*   **Management Layer:** Coolify (Self-hosted PaaS).
*   **Platform:** Django Admin (built-in framework).
*   **Database:** Direct connection to the PostgreSQL database used by Supabase (shared `public` schema).
*   **Deployment:** Managed by Coolify (using Docker Compose for Supabase and Nixpacks/Docker for Django).
*   **Proxy & SSL:** Managed by Traefik (Coolify's built-in proxy).
*   **Access:** Exposed via Coolify-managed routes on `api.nodes-tracker.ru/admin/`.

## 4. Features

### 4.1 User & Subscription Management
*   **Model:** `Profile` (linked to `public.profiles`).
*   **Fields:** `email`, `is_pro`, `pro_expires_at`, `subscription_plan`.
*   **Actions:**
    *   "Grant 30 Days Pro": Single-click action to extend subscription.
    *   "Revoke Subscription": Reset status to Free and clear expiry date.
*   **Search:** Search by email, filter by Pro status or Plan.

### 4.2 Content Management
*   **Models:** `Node`, `Pulse`, `Tag`, `Category`.
*   **Capabilities:** View user-created nodes, delete inappropriate content, troubleshoot pulse data.

### 4.3 Analytics Dashboard
*   **Implementation:** Custom `index.html` template for Django Admin or `django-admin-charts`.
*   **Metrics:**
    *   Total users count.
    *   Active Pro users vs Free users.
    *   New users (last 24h / 7d).
    *   Pulse activity graph (total pulses logged per day).

## 5. Security Measures
*   **Separate Auth:** Django Admin will use its own `auth_user` table, separate from Supabase `auth.users`.
*   **Superuser:** A dedicated admin account created via CLI (`manage.py createsuperuser`).
*   **Nginx Protection:** (Optional) IP allow-listing or basic auth for the `/admin/` route.
*   **Secret Path:** The admin URL can be changed from `/admin/` to a custom string (e.g., `/nodes-mgmt-console/`).

## 6. Implementation Strategy (High Level)
1.  Define Django Models to match existing Supabase tables (using `managed = False` where appropriate to prevent Django from altering Supabase schema).
2.  Register models in `admin.py`.
3.  Implement custom "Admin Actions" for subscription logic.
4.  Add analytics views using Django aggregation functions.
5.  Update Nginx config on VPS to route admin traffic.

## 7. Success Criteria
*   Admin can log in and see a list of all users.
*   Admin can toggle Pro status for a user without writing SQL.
*   Dashboard displays accurate counts of new users and pulses.
