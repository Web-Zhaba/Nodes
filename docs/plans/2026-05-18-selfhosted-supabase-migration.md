# Миграция Nodes на Self-Hosted Supabase (HSHP VPS)

> **For Claude:** REQUIRED SUB-SKILL: Use executing-plans to implement this plan task-by-task.

**Goal:** Перенос проекта Nodes с облачного Supabase на self-hosted инфраструктуру (HSHP VPS, 4 CPU / 8 GB RAM / 120 GB NVMe, домен nodes-tracker.ru) с сохранением всех сервисов: PostgreSQL + Auth + PostgREST + Studio + Django backend.

**Architecture:** Slim Supabase stack (без realtime/storage/functions/analytics) + Django backend в Docker-контейнерах на одном VPS. Frontend остаётся на Vercel. Nginx как reverse proxy + SSL termination.

**Tech Stack:** Docker Compose, Supabase self-hosted (PostgreSQL 15, GoTrue, PostgREST, Kong, Studio), Django 6 + Gunicorn, Nginx, Let's Encrypt.

---

## Важное замечание: Отсутствующие SQL-функции

В коде фронтенда (`nodeService.ts`) вызываются две PostgreSQL функции через RPC:
- `save_node_progress(p_node_id, p_value, p_date, p_is_incremental)`
- `cancel_node_progress(p_node_id, p_date)`

**Эти функции существуют только в облачном Supabase и НЕ находятся в репозитории!** Перед миграцией их необходимо экспортировать из Supabase Studio (SQL Editor → \df) или включить в дамп схемы. Без них создание/удаление импульсов сломается.

---

## Добавление сервисов в будущем (Realtime и др.)

Slim-конфигурация — это просто урезанный `docker-compose.yml`. Чтобы добавить, например, Realtime позже:

1. Раскомментировать/добавить сервис `realtime` в `docker-compose.yml`
2. Добавить переменные окружения в `.env`
3. Выполнить `docker compose up -d`

Существующие данные в PostgreSQL **не пострадают** — новые сервисы просто подключатся к той же БД. Это модульная архитектура.

---

## Подготовительные работы (вне VPS)

### Task 1: Экспорт отсутствующих SQL-функций

**Цель:** Получить определения `save_node_progress` и `cancel_node_progress`.

**Step 1:** Открыть Supabase Studio → SQL Editor.

**Step 2:** Выполнить запрос:
```sql
SELECT prosrc FROM pg_proc WHERE proname IN ('save_node_progress', 'cancel_node_progress');
```

**Step 3:** Сохранить результат в файл `docs/migrations/rpc_functions.sql`.

**Step 4:** Альтернативно — выполнить полный дамп схемы из облака:
```bash
pg_dump --clean --if-exists --schema-only \
  --schema=public \
  "postgresql://postgres:[пароль]@db.[project].supabase.co:5432/postgres" \
  > docs/migrations/schema_from_cloud.sql
```

**Step 5:** Проверить, что функции на месте:
```bash
grep -n "save_node_progress\|cancel_node_progress" docs/migrations/schema_from_cloud.sql
```

---

### Task 2: Настройка домена и DNS

**Step 1:** Убедиться, что A-записи настроены:
```
nodes-tracker.ru      → [IP VPS]
api.nodes-tracker.ru  → [IP VPS]
db.nodes-tracker.ru   → [IP VPS]
studio.nodes-tracker.ru → [IP VPS]
```

**Step 2:** Проверить разрешение DNS:
```bash
nslookup nodes-tracker.ru
nslookup api.nodes-tracker.ru
```

---

### Task 3: OAuth Apps (Google, GitHub)

**Step 1:** Google Cloud Console → APIs & Services → Credentials:
- Добавить Authorized redirect URI: `https://db.nodes-tracker.ru/auth/v1/callback`
- Скопировать Client ID и Client Secret для `.env`

**Step 2:** GitHub Developer Settings → OAuth Apps:
- Homepage URL: `https://nodes-tracker.ru`
- Authorization callback URL: `https://db.nodes-tracker.ru/auth/v1/callback`
- Скопировать Client ID и Client Secret для `.env`

---

## Настройка VPS (HSHP)

### Task 4: Первоначальная настройка сервера

**Step 1:** Подключиться по SSH:
```bash
ssh root@[IP_VPS]
```

**Step 2:** Обновить систему:
```bash
apt update && apt upgrade -y
```

**Step 3:** Установить базовые пакеты:
```bash
apt install -y curl wget git ufw fail2ban certbot python3-certbot-nginx nginx
```

**Step 4:** Настроить firewall:
```bash
ufw default deny incoming
ufw default allow outgoing
ufw allow ssh
ufw allow 80/tcp
ufw allow 443/tcp
ufw enable
```

**Step 5:** Настроить Docker mirror (для России):
```bash
mkdir -p /etc/docker
cat > /etc/docker/daemon.json << 'EOF'
{
  "registry-mirrors": ["https://mirror.yandex.ru", "https://mirror.gcr.io"]
}
EOF
systemctl restart docker
```

**Step 6:** Установить Docker и Docker Compose:
```bash
curl -fsSL https://get.docker.com | sh
systemctl enable docker
systemctl start docker
```

---

### Task 5: Настройка Nginx и SSL

**Step 1:** Создать директорию для конфигов:
```bash
mkdir -p /opt/nodes/nginx/conf.d
```

**Step 2:** Создать основной конфиг:
**File:** `/opt/nodes/nginx/nginx.conf`
```nginx
user nginx;
worker_processes auto;
error_log /var/log/nginx/error.log warn;
pid /var/run/nginx.pid;

events {
    worker_connections 1024;
}

http {
    include /etc/nginx/mime.types;
    default_type application/octet-stream;
    log_format main '$remote_addr - $remote_user [$time_local] "$request" '
                    '$status $body_bytes_sent "$http_referer" '
                    '"$http_user_agent" "$http_x_forwarded_for"';
    access_log /var/log/nginx/access.log main;
    sendfile on;
    keepalive_timeout 65;
    gzip on;
    include /etc/nginx/conf.d/*.conf;
}
```

**Step 3:** Создать конфиг для nodes-tracker.ru:
**File:** `/opt/nodes/nginx/conf.d/nodes-tracker.ru.conf`
```nginx
# Supabase Auth + PostgREST (db.nodes-tracker.ru)
server {
    listen 443 ssl http2;
    server_name db.nodes-tracker.ru;

    ssl_certificate /etc/letsencrypt/live/nodes-tracker.ru/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/nodes-tracker.ru/privkey.pem;

    location / {
        proxy_pass http://localhost:8000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

# Django API (api.nodes-tracker.ru)
server {
    listen 443 ssl http2;
    server_name api.nodes-tracker.ru;

    ssl_certificate /etc/letsencrypt/live/nodes-tracker.ru/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/nodes-tracker.ru/privkey.pem;

    location / {
        proxy_pass http://localhost:8001;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 300s;
    }
}

# Supabase Studio (studio.nodes-tracker.ru)
server {
    listen 443 ssl http2;
    server_name studio.nodes-tracker.ru;

    ssl_certificate /etc/letsencrypt/live/nodes-tracker.ru/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/nodes-tracker.ru/privkey.pem;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

# HTTP → HTTPS redirect
server {
    listen 80;
    server_name nodes-tracker.ru api.nodes-tracker.ru db.nodes-tracker.ru studio.nodes-tracker.ru;
    return 301 https://$server_name$request_uri;
}
```

**Step 4:** Получить SSL-сертификат:
```bash
certbot certonly --nginx -d nodes-tracker.ru -d api.nodes-tracker.ru -d db.nodes-tracker.ru -d studio.nodes-tracker.ru
```

---

## Развёртывание Slim Supabase Stack

### Task 6: Клонирование и настройка Supabase

**Step 1:** Клонировать официальный репозиторий:
```bash
cd /opt/nodes
git clone --depth 1 https://github.com/supabase/supabase.git
```

**Step 2:** Перейти в директорию Docker:
```bash
cd supabase/docker
```

**Step 3:** Скопировать `.env`:
```bash
cp .env.example .env
```

**Step 4:** Сгенерировать ключи:
```bash
# JWT Secret (для HS256)
openssl rand -base64 32

# Anon Key (JWT с ролью anon)
# Используем инструмент или онлайн-генератор для JWT с payload: { "role": "anon" }
# Или используем готовый скрипт из репозитория
```

**Step 5:** Отредактировать `.env`:
```bash
nano .env
```

Ключевые переменные:
```env
# Database
POSTGRES_PASSWORD=your_strong_postgres_password_32_chars
JWT_SECRET=your_base64_jwt_secret_from_step_4
ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...anon_key_jwt
SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...service_role_jwt

# Studio
STUDIO_DEFAULT_ORGANIZATION=Nodes
STUDIO_DEFAULT_PROJECT=Nodes Tracker
STUDIO_PORT=3000

# Auth (GoTrue)
SITE_URL=https://nodes-tracker.ru
ADDITIONAL_REDIRECT_URLS=https://nodes-tracker.ru/auth/callback
JWT_EXPIRY=3600
DISABLE_SIGNUP=false

# SMTP (Yandex 360 для домена)
SMTP_HOST=smtp.yandex.ru
SMTP_PORT=465
SMTP_USER=noreply@nodes-tracker.ru
SMTP_PASS=your_yandex_app_password
SMTP_SENDER_NAME=Nodes Tracker

# OAuth - Google
EXTERNAL_GOOGLE_ENABLED=true
EXTERNAL_GOOGLE_CLIENT_ID=your_google_client_id.apps.googleusercontent.com
EXTERNAL_GOOGLE_SECRET=your_google_secret

# OAuth - GitHub
EXTERNAL_GITHUB_ENABLED=true
EXTERNAL_GITHUB_CLIENT_ID=your_github_client_id
EXTERNAL_GITHUB_SECRET=your_github_secret

# API
KONG_HTTP_PORT=8000
KONG_HTTPS_PORT=8443
```

---

### Task 7: Модификация docker-compose.yml (Slim Stack)

**Step 1:** Создать резервную копию:
```bash
cp docker-compose.yml docker-compose.yml.bak
```

**Step 2:** Редактировать `docker-compose.yml`:

Удалить/закомментировать сервисы:
- `realtime`
- `storage`
- `storage-image-proxy` (imgproxy)
- `functions` (edge-runtime)
- `analytics`
- `vector`
- `logflare`

Оставить:
- `studio`
- `kong`
- `auth` (GoTrue)
- `rest` (PostgREST)
- `meta` (pg-meta для Studio)
- `db` (PostgreSQL)

**Step 3:** Добавить сервис Django:

В конец `docker-compose.yml` добавить:
```yaml
  django:
    build:
      context: ../../nodes-backend
      dockerfile: Dockerfile
    container_name: nodes-django
    environment:
      DATABASE_URL: postgresql://postgres:${POSTGRES_PASSWORD}@db:5432/postgres
      SUPABASE_URL: https://db.nodes-tracker.ru
      SUPABASE_JWT_SECRET: ${JWT_SECRET}
      SECRET_KEY: $(openssl rand -base64 50)
      DEBUG: "False"
      ALLOWED_HOSTS: api.nodes-tracker.ru,localhost,127.0.0.1
      CORS_ALLOWED_ORIGINS: https://nodes-tracker.ru,https://www.nodes-tracker.ru
    depends_on:
      db:
        condition: service_healthy
    networks:
      - default
    restart: unless-stopped
    ports:
      - "8001:8000"
```

**Step 4:** Запустить стек:
```bash
docker compose up -d
```

**Step 5:** Проверить статус:
```bash
docker compose ps
docker compose logs -f db
```

---

### Task 8: Контейнеризация Django Backend

**Step 1:** Создать Dockerfile:
**File:** `nodes-backend/Dockerfile`
```dockerfile
FROM python:3.12-slim

WORKDIR /app

# Установка системных зависимостей
RUN apt-get update && apt-get install -y \
    gcc \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Копирование requirements
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Копирование кода
COPY . .

# Сборка статики (если нужна)
RUN python manage.py collectstatic --noinput || true

# Запуск через Gunicorn
CMD ["gunicorn", "--bind", "0.0.0.0:8000", "--workers", "4", "--threads", "2", "--timeout", "60", "config.wsgi:application"]
```

**Step 2:** Проверить requirements.txt:
Убедиться, что есть:
```
Django>=6.0
psycopg[binary]
gunicorn
djangorestframework
django-cors-headers
dj-database-url
PyJWT
requests
python-dotenv
```

---

### Task 9: Миграция данных из облака

**Step 1:** Создать дамп схемы public (включая отсутствующие функции):
```bash
pg_dump --clean --if-exists --schema-only \
  --schema=public \
  "postgresql://postgres:[пароль]@db.[project].supabase.co:5432/postgres" \
  > /opt/nodes/migration/schema.sql
```

**Step 2:** Создать дамп данных public:
```bash
pg_dump --data-only --schema=public \
  --exclude-table-data=auth.users \
  "postgresql://postgres:[пароль]@db.[project].supabase.co:5432/postgres" \
  > /opt/nodes/migration/data.sql
```

**Step 3:** Скопировать дампы на сервер (если делались локально):
```bash
scp schema.sql root@[IP_VPS]:/opt/nodes/migration/
scp data.sql root@[IP_VPS]:/opt/nodes/migration/
```

**Step 4:** Применить схему:
```bash
cd /opt/nodes/supabase/docker
docker compose cp /opt/nodes/migration/schema.sql db:/tmp/
docker compose exec -T db psql -U postgres -d postgres < /tmp/schema.sql
```

**Step 5:** Применить данные:
```bash
docker compose cp /opt/nodes/migration/data.sql db:/tmp/
docker compose exec -T db psql -U postgres -d postgres < /tmp/data.sql
```

**Step 6:** Миграция пользователей:

Создать скрипт `/opt/nodes/migration/migrate_users.py`:
```python
import requests
import json

# Конфигурация
SUPABASE_URL = "https://db.nodes-tracker.ru"
SERVICE_ROLE_KEY = "your_service_role_key"

# API GoTrue для создания пользователей
headers = {
    "Authorization": f"Bearer {SERVICE_ROLE_KEY}",
    "Content-Type": "application/json"
}

# Читаем список пользователей из облака (предварительно экспортированный)
users = [
    # { "id": "uuid", "email": "user@example.com" },
]

for user in users:
    response = requests.post(
        f"{SUPABASE_URL}/auth/v1/admin/users",
        headers=headers,
        json={
            "id": user["id"],
            "email": user["email"],
            "email_confirm": True,
            "user_metadata": {}
        }
    )
    print(f"User {user['email']}: {response.status_code}")
```

**Step 7:** После миграции пользователей — обновить профили:
```sql
-- Подключаемся к БД и проверяем, что профили созданы автоматически через триггер
SELECT id, email FROM auth.users;
SELECT id, email FROM public.profiles;

-- Если триггер сработал, но данные профилей пустые — обновляем из бэкапа
-- (предполагаем, что есть CSV/JSON с данными профилей)
```

**Step 8:** Перезапустить Django:
```bash
docker compose restart django
```

---

## Конфигурация Django Backend

### Task 10: Обновление настроек Django

**Step 1:** Изменить `nodes-backend/config/settings.py`:

```python
ALLOWED_HOSTS = os.getenv('ALLOWED_HOSTS', 'localhost,127.0.0.1').split(',')

# CORS
CORS_ALLOWED_ORIGINS = [
    "https://nodes-tracker.ru",
    "https://www.nodes-tracker.ru",
    "http://localhost:5173",
]
CORS_ALLOW_ALL_ORIGINS = False  # Строгий режим для продакшена
```

**Step 2:** Пересобрать контейнер Django:
```bash
cd /opt/nodes/supabase/docker
docker compose build django
docker compose up -d django
```

---

## Конфигурация Frontend (Vercel)

### Task 11: Обновление переменных окружения

**Step 1:** В панели Vercel (или `.env.local` для dev) обновить:
```env
VITE_SUPABASE_URL=https://db.nodes-tracker.ru
VITE_SUPABASE_ANON_KEY=your_new_anon_key_from_vps_env
VITE_DJANGO_API_URL=https://api.nodes-tracker.ru/api/v1
```

**Step 2:** Пересобрать и задеплоить:
```bash
cd nodes-frontend
vercel --prod
```

---

## Тестирование и проверка

### Task 12: Проверка компонентов

**Step 1:** Проверить Studio:
- Открыть `https://studio.nodes-tracker.ru`
- Войти с паролем PostgreSQL
- Проверить таблицы и данные

**Step 2:** Проверить Auth:
- Открыть приложение `https://nodes-tracker.ru`
- Попробовать вход по email/пароль
- Проверить создание нового пользователя
- Проверить OAuth (Google/GitHub)

**Step 3:** Проверить PostgREST:
```bash
curl -H "apikey: $ANON_KEY" \
     -H "Authorization: Bearer $ANON_KEY" \
     https://db.nodes-tracker.ru/rest/v1/profiles?select=*&limit=1
```

**Step 4:** Проверить Django:
```bash
curl -X POST \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer [JWT_TOKEN]" \
     https://api.nodes-tracker.ru/api/v1/stability/calculate/
```

**Step 5:** Проверить процесс импульса:
- Создать импульс через UI
- Проверить, что `save_node_progress` срабатывает без ошибок
- Удалить импульс, проверить `cancel_node_progress`

---

## Бэкапы и мониторинг

### Task 13: Настройка автоматических бэкапов

**Step 1:** Создать скрипт бэкапа:
**File:** `/opt/nodes/scripts/backup.sh`
```bash
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/opt/nodes/backups"
CONTAINER="nodes-db-1"  # или supabase-db-1

mkdir -p $BACKUP_DIR

# Бэкап PostgreSQL
docker exec $CONTAINER pg_dumpall -U postgres | gzip > "$BACKUP_DIR/nodes_backup_$DATE.sql.gz"

# Удаление старых бэкапов (оставляем 7 дней)
find $BACKUP_DIR -name "nodes_backup_*.sql.gz" -mtime +7 -delete

echo "Backup completed: $BACKUP_DIR/nodes_backup_$DATE.sql.gz"
```

**Step 2:** Сделать исполняемым:
```bash
chmod +x /opt/nodes/scripts/backup.sh
```

**Step 3:** Добавить в cron:
```bash
0 3 * * * /opt/nodes/scripts/backup.sh >> /var/log/nodes-backup.log 2>&1
```

---

## Итоговый чек-лист

- [ ] Экспортированы `save_node_progress` и `cancel_node_progress`
- [ ] Настроены DNS-записи (A для 4 субдоменов)
- [ ] Настроены OAuth Apps (Google, GitHub)
- [ ] VPS подготовлен (Docker, Nginx, firewall)
- [ ] SSL-сертификаты получены
- [ ] Slim Supabase stack развёрнут
- [ ] Django контейнеризирован и запущен
- [ ] Данные мигрированы
- [ ] Пользователи перенесены
- [ ] Frontend обновлён и задеплоен
- [ ] Бэкапы настроены
- [ ] Все компоненты протестированы

---

## Потенциальные проблемы и решения

| Проблема | Решение |
|----------|---------|
| **Пользователи не могут войти** | Пароли не переносятся напрямую. Нужно сбросить пароли через Studio или отправить email для сброса. |
| **JWKS не работает (ES256)** | Django использует HS256 через `SUPABASE_JWT_SECRET` — должен работать из коробки. Проверить `.env`. |
| **Studio не доступна** | Проверить `docker compose logs studio`. Может не хватать переменных `STUDIO_`. |
| **Django не подключается к БД** | Проверить `DATABASE_URL` — должен быть внутри Docker network: `postgres://postgres:...@db:5432/postgres` |
| **CORS ошибки в frontend** | Проверить `CORS_ALLOWED_ORIGINS` в Django и Vercel домен. |
| **Email не отправляются** | Проверить SMTP-настройки в `.env`. Yandex требует специального "пароля приложения". |
| **Realtime понадобится позже** | Просто раскомментировать сервис в `docker-compose.yml` и запустить `docker compose up -d`. |

---

## Оценка ресурсов на VPS

| Сервис | RAM (idle) | CPU |
|--------|-----------|-----|
| PostgreSQL | ~512 MB | низкая |
| GoTrue (Auth) | ~128 MB | низкая |
| PostgREST | ~64 MB | низкая |
| Kong | ~256 MB | низкая |
| Studio | ~256 MB | низкая |
| Django + Gunicorn | ~512 MB | средняя |
| Nginx (хост) | ~64 MB | низкая |
| **Всего (idle)** | **~1.8 GB** | |
| **Запас на пиковую нагрузку** | **~6 GB** | |

**Вывод:** 8 GB RAM достаточно для текущей нагрузки и роста до ~1000 активных пользователей.

---

## Следующие шаги после миграции

1. **Настроить логирование и мониторинг** (Prometheus + Grafana для метрик Docker)
2. **Настроить алерты** (Telegram-бот при падении контейнеров)
3. **Рассмотреть CDN** для статики (Cloud.ru, Selectel)
4. **Подготовить план масштабирования** (увеличение RAM до 16 GB при росте)

---

**План завершён. Для выполнения используйте executing-plans skill.**
