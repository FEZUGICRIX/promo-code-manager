---
inclusion: auto
---

# PromoCode Manager - Project Overview

## КРИТИЧЕСКИ ВАЖНО: Package Manager

**ВСЕГДА ИСПОЛЬЗУЙ pnpm ДЛЯ ВСЕХ ОПЕРАЦИЙ!**

- ❌ `npm install` → ✅ `pnpm install`
- ❌ `npm add` → ✅ `pnpm add`
- ❌ `npm run` → ✅ `pnpm run`

## Цель проекта

Fullstack приложение для управления промокодами с аналитикой, демонстрирующее CQRS-архитектуру.

## Ключевая концепция: CQRS

### Command Query Responsibility Segregation

Разделение путей записи и чтения данных между разными хранилищами:

```
┌─────────────┐
│   Frontend  │
└──────┬──────┘
       │
       ├─── Мутации (POST/PATCH/DELETE) ──→ MongoDB
       │                                      ↓
       │                              Синхронизация
       │                                      ↓
       └─── Чтение таблиц (GET) ──────→ ClickHouse
```

### Правила CQRS

1. **MongoDB** - источник истины
   - Все CREATE, UPDATE, DELETE операции
   - Валидация бизнес-правил
   - Mongoose схемы

2. **ClickHouse** - аналитическое хранилище
   - Все таблицы на фронтенде читают ТОЛЬКО отсюда
   - Денормализованные данные (имена, email, коды - не только ID)
   - Агрегации, GROUP BY, аналитика

3. **Redis** - вспомогательное хранилище
   - Кэширование результатов ClickHouse
   - Distributed locks (race condition защита)
   - Rate limiting
   - Сессии/refresh токены

### Синхронизация

При каждой мутации в MongoDB → автоматическая репликация в ClickHouse:

```typescript
// 1. Сохранить в MongoDB
const promocode = await this.promocodeModel.create(dto)

// 2. Синхронизировать в ClickHouse
await this.clickhouseService.insertPromocode({
	id: promocode._id.toString(),
	code: promocode.code,
	discount: promocode.discount,
	// ... все поля
})
```

## Технологический стек

### Backend

- **NestJS** - фреймворк
- **TypeScript** - язык (strict mode)
- **MongoDB + Mongoose** - основная БД
- **ClickHouse** - аналитическая БД
- **Redis** - кэш, locks, rate limiting
- **JWT** - аутентификация
- **Swagger** - документация API

### Frontend

- **React 18** - UI библиотека
- **TypeScript** - язык (strict mode)
- **Vite** - сборщик
- **TanStack Table** - server-side таблицы
- **TanStack Query** - data fetching
- **React Hook Form + Zod** - формы и валидация
- **shadcn/ui + Tailwind** - UI компоненты
- **Axios** - HTTP клиент

### Инфраструктура

- **Docker Compose** - оркестрация
- **pnpm** - package manager

## Структура данных

### Таблицы ClickHouse

1. **users** - пользователи
   - id, email, name, phone, isActive, createdAt
   - Агрегаты: totalOrders, totalSpent, promocodesUsed

2. **promocodes** - промокоды
   - id, code, discount, totalLimit, userLimit, dateFrom, dateTo, isActive, createdAt
   - Метрики: timesUsed, totalRevenue, uniqueUsers

3. **orders** - заказы
   - id, userId, userName, userEmail, amount, discount, promocodeId, promocodeCode, createdAt

4. **promo_usages** - история использований
   - id, promocodeId, promocodeCode, userId, userName, orderId, discount, createdAt

### Денормализация

Каждая таблица в ClickHouse самодостаточна:

- Не только `userId`, но и `userName`, `userEmail`
- Не только `promocodeId`, но и `promocodeCode`, `discount`
- Аналитика показывает человекочитаемые данные без JOIN к MongoDB

## Бизнес-логика

### Создание и применение промокода (два действия!)

1. **Создание заказа**: `POST /orders`
   - Пользователь создает заказ с суммой
   - Заказ существует БЕЗ промокода

2. **Применение промокода**: `POST /orders/:id/apply-promocode`
   - Отдельный endpoint
   - Валидация всех условий
   - Расчет скидки
   - Обновление заказа + запись использования

### Валидация промокода

Проверяй ВСЕ условия:

- ✅ Промокод существует и активен
- ✅ Срок действия (dateFrom/dateTo)
- ✅ Общий лимит не превышен
- ✅ Лимит на пользователя не превышен
- ✅ Промокод не применен к этому заказу ранее
- ✅ Заказ принадлежит текущему пользователю

### Race Condition защита

При применении промокода используй Redis distributed lock:

```typescript
const lock = await redis.set(`lock:promocode:${code}`, '1', 'NX', 'EX', 10)
if (!lock) throw new ConflictException('Промокод уже применяется')
try {
	// ... применение промокода
} finally {
	await redis.del(`lock:promocode:${code}`)
}
```

## Server-Side таблицы

### Обязательные фичи

1. **Пагинация** - `page`, `pageSize`
2. **Сортировка** - `sortBy`, `sortOrder`
3. **Фильтр по датам** - `dateFrom`, `dateTo`
4. **Фильтры по колонкам** - специфичные для каждой таблицы

### Пример API запроса

```
GET /analytics/users?page=1&pageSize=10&sortBy=totalSpent&sortOrder=desc&dateFrom=2024-01-01&dateTo=2024-12-31
```

### Ответ API

```json
{
  "data": [...],
  "total": 150,
  "page": 1,
  "pageSize": 10
}
```

### НИКОГДА

❌ `findAll()` без лимита
❌ Пагинация на клиенте
❌ Сортировка на клиенте
❌ Загрузка всех данных в память

## Безопасность

### JWT

- Access token: 15 минут
- Refresh token: 7 дней
- Bearer схема в заголовках

### Пароли

- Хэширование через bcrypt
- `passwordHash` с `select: false` в схеме
- Никогда не возвращай пароли в API

### SQL Injection защита

- Параметризованные запросы к ClickHouse
- НИКОГДА не используй строковую интерполяцию

### Rate Limiting

- Login: 5 попыток в минуту
- Apply promocode: 10 попыток в минуту
- Используй `@nestjs/throttler`

## Критерии успеха

### Минимум на "хорошо" (48-61 балл)

- ✅ Docker Compose работает из коробки
- ✅ CQRS полностью реализован
- ✅ 4 таблицы в ClickHouse с денормализацией
- ✅ Синхронизация MongoDB → ClickHouse
- ✅ Redis используется (2+ use-case)
- ✅ 3 аналитические таблицы с server-side операциями
- ✅ Глобальный фильтр по датам
- ✅ JWT авторизация
- ✅ TypeScript strict mode, нет any
- ✅ Валидация всех форм и DTO

### Бонусы (до 78 баллов)

- Swagger документация
- Unit тесты
- Race condition тесты
- Детальная документация архитектуры

## Команды для работы

### Полный запуск

```bash
# Из корня проекта
docker-compose up -d
```

### Локальная разработка Backend

```bash
cd backend
pnpm install
pnpm run start:dev
```

### Локальная разработка Frontend

```bash
cd frontend
pnpm install
pnpm run dev
```

### Остановка

```bash
docker-compose down
```

### Очистка volumes

```bash
docker-compose down -v
```

## Порты

- Frontend: http://localhost:5173
- Backend API: http://localhost:3000
- Swagger: http://localhost:3000/api
- MongoDB: localhost:27017
- ClickHouse HTTP: localhost:8123
- ClickHouse Native: localhost:9000
- Redis: localhost:6379

## Приоритеты разработки

### День 1: Backend

1. ClickHouse + Redis модули
2. Auth модуль (JWT)
3. Users, Promocodes, Orders модули
4. Синхронизация MongoDB → ClickHouse
5. Analytics endpoints

### День 2: Frontend

1. Auth страницы (Login, Register)
2. Layout + Navigation
3. 3 аналитические таблицы
4. Формы (промокоды, заказы)
5. Глобальный фильтр по датам
6. Полировка + тестирование

## Помни

- **pnpm** для всех команд
- **CQRS** - мутации в MongoDB, чтение таблиц из ClickHouse
- **Денормализация** - ClickHouse должен быть самодостаточным
- **Server-side** - все операции таблиц на бэкенде
- **TypeScript strict** - никаких any
- **Параметризация** - защита от SQL injection
