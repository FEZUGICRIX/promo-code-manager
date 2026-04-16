# Quick Start Guide

## Предварительные требования

1. **Docker и Docker Compose** установлены
2. **pnpm** установлен глобально:

   ```bash
   npm install -g pnpm
   ```

## Быстрый запуск (Docker)

### 1. Клонировать репозитор ий

```bash
git clone <repo-url>
cd promocode-manager
```

### 2. Запустить всю инфраструктуру

```bash
docker compose up -d
```

Это запустит:

- MongoDB (порт 27017)
- ClickHouse (порты 8123, 9000)
- Redis (порт 6379)
- Backend (порт 3000)
- Frontend (порт 5173)

### 3. Проверить статус

```bash
docker-compose ps
```

Все сервисы должны быть в статусе "Up" и "healthy".

### 4. Открыть приложение

- Frontend: http://localhost:5173
- Backend API: http://localhost:3000
- Swagger документация: http://localhost:3000/api

### 5. Остановить

```bash
docker-compose down
```

### 6. Очистить данные (если нужно)

```bash
docker-compose down -v
```

---

## Локальная разработка (без Docker)

### Требования

- Node.js 18+
- pnpm
- MongoDB запущен локально
- ClickHouse запущен локально
- Redis запущен локально

### 1. Установить зависимости

Из корня проекта:

```bash
pnpm install
```

Или для каждого проекта отдельно:

```bash
# Backend
cd backend
pnpm install

# Frontend
cd frontend
pnpm install
```

### 2. Настроить переменные окружения

Backend:

```bash
cd backend
cp .env.example .env
# Отредактируй .env под свои настройки
```

Frontend:

```bash
cd frontend
cp .env.example .env
# Отредактируй .env под свои настройки
```

### 3. Инициализировать ClickHouse

Выполни SQL из `backend/clickhouse-init/init.sql` в ClickHouse:

```bash
clickhouse-client --multiquery < backend/clickhouse-init/init.sql
```

### 4. Запустить Backend

```bash
cd backend
pnpm run start:dev
```

Backend будет доступен на http://localhost:3000

### 5. Запустить Frontend

```bash
cd frontend
pnpm run dev
```

Frontend будет доступен на http://localhost:5173

---

## Полезные команды

### Из корня проекта (используя pnpm workspace)

```bash
# Установить все зависимости
pnpm install

# Запустить backend в dev режиме
pnpm run dev:backend

# Запустить frontend в dev режиме
pnpm run dev:frontend

# Собрать backend
pnpm run build:backend

# Собрать frontend
pnpm run build:frontend

# Docker команды
pnpm run docker:up      # Запустить все сервисы
pnpm run docker:down    # Остановить все сервисы
pnpm run docker:logs    # Показать логи
pnpm run docker:clean   # Остановить и удалить volumes
```

### Backend команды

```bash
cd backend

# Разработка
pnpm run start:dev

# Сборка
pnpm run build

# Продакшн
pnpm run start:prod

# Линтинг
pnpm run lint

# Форматирование
pnpm run format
```

### Frontend команды

```bash
cd frontend

# Разработка
pnpm run dev

# Сборка
pnpm run build

# Превью продакшн сборки
pnpm run preview

# Линтинг
pnpm run lint
```

---

## Первый запуск

### 1. Зарегистрировать пользователя

Открой http://localhost:5173/register и создай аккаунт:

- Email: test@example.com
- Password: Test123456
- Name: Test User
- Phone: +1234567890

### 2. Войти в систему

Используй созданные credentials на http://localhost:5173/login

### 3. Создать промокод

Перейди в раздел "Промокоды" и создай первый промокод:

- Code: SUMMER2024
- Discount: 20
- Total Limit: 100
- User Limit: 1

### 4. Создать заказ

Перейди в раздел "Заказы" и создай заказ:

- Amount: 1000

### 5. Применить промокод

В списке заказов нажми "Применить промокод" и введи: SUMMER2024

### 6. Проверить аналитику

Перейди в разделы:

- "Пользователи" - увидишь статистику по пользователям
- "Промокоды" - увидишь метрики эффективности
- "История" - увидишь все использования промокодов

---

## Troubleshooting

### Docker контейнеры не запускаются

```bash
# Проверить логи
docker-compose logs

# Проверить конкретный сервис
docker-compose logs backend
docker-compose logs mongodb
docker-compose logs clickhouse
```

### Backend не подключается к MongoDB

- Проверь, что MongoDB контейнер запущен: `docker-compose ps`
- Проверь переменные окружения в `docker-compose.yml`
- Проверь логи MongoDB: `docker-compose logs mongodb`

### Frontend не может подключиться к Backend

- Проверь, что Backend запущен и отвечает: `curl http://localhost:3000`
- Проверь CORS настройки в `backend/src/main.ts`
- Проверь `VITE_API_URL` в frontend

### ClickHouse таблицы не создаются

- Проверь, что init.sql выполнился: `docker-compose logs clickhouse`
- Выполни вручную: `docker exec -it promocode-clickhouse clickhouse-client --multiquery < /docker-entrypoint-initdb.d/init.sql`

### Redis не работает

- Проверь подключение: `docker exec -it promocode-redis redis-cli -a redis123 ping`
- Должен вернуть: `PONG`

---

## Структура проекта

```
promocode-manager/
├── .kiro/
│   └── steering/              # Kiro AI guidelines
├── backend/
│   ├── .kiro/steering/        # Backend guidelines
│   ├── clickhouse-init/       # ClickHouse init scripts
│   ├── src/                   # Backend source code
│   ├── .env.example
│   ├── Dockerfile
│   └── package.json
├── frontend/
│   ├── .kiro/steering/        # Frontend guidelines
│   ├── src/                   # Frontend source code
│   ├── .env.example
│   ├── Dockerfile
│   └── package.json
├── docker-compose.yml         # Docker orchestration
├── pnpm-workspace.yaml        # pnpm workspace config
├── package.json               # Root package.json
└── README.md
```

---

## Следующие шаги

1. Изучи [README.md](./README.md) для детального описания архитектуры
2. Изучи [.kiro/steering/project-overview.md](./.kiro/steering/project-overview.md) для понимания CQRS
3. Открой Swagger документацию: http://localhost:3000/api
4. Начни разработку!

---

## Поддержка

При возникновении проблем:

1. Проверь логи: `docker-compose logs`
2. Проверь статус сервисов: `docker-compose ps`
3. Перезапусти сервисы: `docker-compose restart`
4. Очисти и запусти заново: `docker-compose down -v && docker-compose up -d`
