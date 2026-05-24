FROM python:3.12-slim

# Установка системных зависимостей для работы с Postgres
RUN apt-get update && apt-get install -y \
    gcc \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Копируем requirements и устанавливаем их
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Копируем остальной код
COPY . .

# Собираем статику (для админки)
RUN python manage.py collectstatic --noinput

# Запуск через Gunicorn
# Мы слушаем порт 8000
CMD ["gunicorn", "--bind", "0.0.0.0:8000", "--workers", "4", "config.wsgi:application"]
