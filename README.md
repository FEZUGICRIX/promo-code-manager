# PromoCode Manager

Fullstack приложение для управления промокодами с аналитикой, реализующее CQRS-архитектуру.

## Быстрый старт

```bash
git clone <repo-url>
cd promocode-manager
docker compose up -d --build
```

| Сервис      | URL                       |
| ----------- | ------------------------- |
| Frontend    | http://localhost:5173     |
| Backend API | http://localhost:3000     |
| Swagger     | http://localhost:3000/api |
| MongoDB     | localhost:27017           |
| ClickHouse  | localhost:8123 (HTTP)     |
| Redis       | localhost:6379            |

> Все сервисы поднимаются автоматически. Таблицы ClickHouse создаются при старте бэкенда.

## Технологический стек

| Слой           | Технологии                                              |
| -------------- | ------------------------------------------------------- |
| Backend        | NestJS, TypeScript, Mongoose, @clickhouse/client        |
| Frontend       | React, TypeScript, Vite, TanStack Table, TanStack Query |
| UI             | Tailwind CSS                                            |
| Базы данных    | MongoDB, ClickHouse, Redis                              |
| Инфраструктура | Docker Compose                                          |

## Архитектура (CQRS)

```
Клиент
  │
  ├── Мутации (POST/PATCH/DELETE) ──► NestJS ──► MongoDB (источник истины)
  │                                                  │
  │                                          sync-on-write
  │                                                  │
  │                                                  ▼
  └── Чтение таблиц (GET /analytics/*) ──► NestJS ──► ClickHouse (аналитика)
```

- **MongoDB** — все мутации, валидация бизнес-правил, источник истины
- **ClickHouse** — все аналитические таблицы на фронтенде читают только отсюда
- **Redis** — distributed lock, кэширование аналитики, rate limiting

### Таблицы ClickHouse

| Таблица        | Содержимое                                                                                            |
| -------------- | ----------------------------------------------------------------------------------------------------- |
| `users`        | id, name, email, phone, isActive, createdAt                                                           |
| `promocodes`   | id, code, discountType, discount, totalLimit, userLimit, dateFrom, dateTo, isActive, createdAt        |
| `orders`       | id, userId, userName, userEmail, amount, discount, finalAmount, promocodeId, promocodeCode, createdAt |
| `promo_usages` | id, orderId, userId, userName, userEmail, promocodeId, promocodeCode, discountAmount, createdAt       |

Все таблицы денормализованы — аналитические запросы не обращаются к MongoDB.

### Синхронизация MongoDB → ClickHouse

Используется **sync-on-write**: после каждой успешной записи в MongoDB данные реплицируются в ClickHouse в той же транзакции запроса.

- Ошибка синхронизации не блокирует основную операцию — логируется и не пробрасывается клиенту
- Таблицы ClickHouse создаются автоматически при старте приложения (`IF NOT EXISTS`)

### Redis

1. **Distributed Lock** — при применении промокода предотвращает race condition (два параллельных запроса не смогут превысить лимит)
2. **Кэширование** — результаты аналитических запросов к ClickHouse (TTL 60 сек), инвалидация при мутациях
3. **Rate Limiting** — ограничение запросов на `/auth/login` и `/orders/:id/apply-promocode`

### Server-side операции в таблицах

Все аналитические таблицы поддерживают:

- пагинацию (`page`, `pageSize`) — `LIMIT / OFFSET` в ClickHouse
- сортировку (`sortBy`, `sortOrder`) — `ORDER BY` с whitelist допустимых колонок
- фильтрацию по диапазону дат (`dateFrom`, `dateTo`) — обязательный параметр для производительности
- текстовый поиск — `ILIKE` по имени/email

## API

### Авторизация

- `POST /auth/register` — регистрация
- `POST /auth/login` — вход
- `POST /auth/refresh` — обновление access токена

### Пользователи

- `GET /users` — список
- `GET /users/:id` — получить
- `PATCH /users/:id` — обновить / деактивировать

### Промокоды

- `GET /promocodes` — список
- `POST /promocodes` — создать
- `GET /promocodes/:id` — получить
- `PATCH /promocodes/:id` — обновить
- `DELETE /promocodes/:id` — деактивировать

### Заказы

- `GET /orders` — мои заказы
- `POST /orders` — создать заказ
- `POST /orders/:id/apply-promocode` — применить промокод к заказу

### Аналитика (ClickHouse)

- `GET /analytics/users` — пользователи с метриками
- `GET /analytics/promocodes` — промокоды с эффективностью
- `GET /analytics/orders` — таблица заказов
- `GET /analytics/promo-usages` — история использований

Полная документация: **http://localhost:3000/api** (Swagger)

## Структура проекта

```
promocode-manager/
├── docker-compose.yml
├── backend/
│   └── src/
│       ├── core/
│       │   ├── clickhouse/     # ClickHouseService
│       │   ├── redis/          # RedisService
│       │   └── config/         # конфигурации
│       └── modules/
│           ├── auth/           # JWT, стратегии, guards
│           ├── users/          # CRUD пользователей
│           ├── promocodes/     # CRUD промокодов
│           ├── orders/         # заказы + применение промокода
│           └── analytics/      # запросы к ClickHouse
└── frontend/
    └── src/
        ├── entities/           # типы, колонки таблиц, API-хуки
        ├── features/           # auth, create-order, фильтры
        ├── widgets/            # составные блоки (таблицы, формы)
        └── pages/              # страницы приложения
```

## Локальная разработка

```bash
# Backend
cd backend
pnpm install
pnpm run start:dev

# Frontend
cd frontend
pnpm install
pnpm run dev
```
