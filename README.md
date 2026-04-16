# PromoCode Manager

Fullstack приложение для управления промокодами с аналитикой, реализующее CQRS-архитектуру.

## Технологический стек

### Backend

- NestJS + TypeScript
- MongoDB (Mongoose) - основное хранилище
- ClickHouse - аналитическая БД
- Redis - кэширование, locks, rate limiting

### Frontend

- React + TypeScript + Vite
- TanStack Table - server-side таблицы
- shadcn/ui + Tailwind CSS
- TanStack Query - data fetching

### Инфраструктура

- Docker Compose

## Архитектура (CQRS)

### Разделение ответственности:

- **MongoDB** - источник истины, все мутации (CREATE, UPDATE, DELETE)
- **ClickHouse** - аналитика, все таблицы на фронтенде читают отсюда
- **Redis** - кэширование, distributed locks, rate limiting

### Таблицы ClickHouse:

1. `users` - пользователи с денормализованными данными
2. `promocodes` - промокоды с метриками
3. `orders` - заказы с информацией о пользователе и промокоде
4. `promo_usages` - история использований промокодов

### Синхронизация:

При каждой мутации в MongoDB данные автоматически реплицируются в ClickHouse (sync-on-write).

## Быстрый старт

### Требования

- Docker и Docker Compose
- Node.js 18+ (для локальной разработки)

### Запуск всего приложения

```bash
# Клонировать репозиторий
git clone <repo-url>
cd promocode-manager


# Запустить всю инфраструктуру
docker-compose up -d

# Приложение будет доступно:
# - Frontend: http://localhost:5173
# - Backend API: http://localhost:3000
# - MongoDB: localhost:27017
# - ClickHouse: localhost:8123 (HTTP), localhost:9000 (Native)
# - Redis: localhost:6379
```

### Локальная разработка

#### Backend

```bash
cd backend
pnpm install
pnpm run start:dev
```

#### Frontend

```bash
cd frontend
pnpm install
pnpm run dev
```

## API Endpoints

### Авторизация

- `POST /auth/register` - регистрация
- `POST /auth/login` - вход
- `POST /auth/refresh` - обновление токена

### Пользователи

- `GET /users` - список пользователей
- `GET /users/:id` - получить пользователя
- `PATCH /users/:id` - обновить пользователя

### Промокоды

- `GET /promocodes` - список промокодов
- `POST /promocodes` - создать промокод
- `GET /promocodes/:id` - получить промокод
- `PATCH /promocodes/:id` - обновить промокод
- `DELETE /promocodes/:id` - деактивировать промокод

### Заказы

- `GET /orders` - мои заказы
- `POST /orders` - создать заказ
- `POST /orders/:id/apply-promocode` - применить промокод к заказу

### Аналитика (данные из ClickHouse)

- `GET /analytics/users` - таблица пользователей с метриками
- `GET /analytics/promocodes` - таблица промокодов с эффективностью
- `GET /analytics/promo-usages` - история использований

## Особенности реализации

### Server-side операции

Все таблицы поддерживают:

- Пагинацию (page, pageSize)
- Сортировку (sortBy, sortOrder)
- Фильтрацию по датам (dateFrom, dateTo)
- Фильтрацию по колонкам

### Redis использование

1. **Distributed Lock** - при применении промокода (защита от race condition)
2. **Кэширование** - результаты аналитических запросов (TTL 60 сек)
3. **Rate Limiting** - на критичных endpoints (login, apply-promocode)

### Валидация промокода

- Активность промокода
- Срок действия (dateFrom/dateTo)
- Общий лимит использований
- Лимит на пользователя
- Промокод не применен к заказу ранее

## Структура проекта

```
promocode-manager/
├── docker-compose.yml
├── README.md
├── backend/
│   ├── src/
│   │   ├── auth/
│   │   ├── users/
│   │   ├── promocodes/
│   │   ├── orders/
│   │   ├── analytics/
│   │   ├── clickhouse/
│   │   └── redis/
│   └── package.json
└── frontend/
    ├── src/
    │   ├── components/
    │   ├── pages/
    │   ├── lib/
    │   └── api/
    └── package.json
```

## Тестовые данные

После запуска можно создать тестового пользователя:

- Email: test@example.com
- Password: Test123456

## Разработка

### Backend

- Swagger документация: http://localhost:3000/api
- Автоматическое создание таблиц ClickHouse при старте
- Hot reload включен

### Frontend

- Hot reload включен
- TypeScript strict mode
- ESLint + Prettier настроены

## Производительность

- ClickHouse оптимизирован для аналитических запросов
- Индексы на часто используемых полях
- Кэширование через Redis
- Параметризованные запросы (защита от SQL injection)

## Безопасность

- JWT токены (access + refresh)
- Пароли хэшируются (bcrypt)
- Валидация всех входных данных (class-validator)
- Rate limiting на критичных endpoints
- Параметризованные запросы к БД

## Лицензия

MIT
