---
inclusion: auto
---

# Backend Development Guidelines

## Package Manager

**ВСЕГДА ИСПОЛЬЗУЙ pnpm** для установки зависимостей и запуска скриптов!

- `pnpm install` вместо `npm install`
- `pnpm add <package>` вместо `npm install <package>`
- `pnpm run <script>` вместо `npm run <script>`

## Архитектура (CQRS)

### Разделение ответственности

- **MongoDB** - источник истины, ВСЕ мутации (CREATE, UPDATE, DELETE)
- **ClickHouse** - ТОЛЬКО чтение для аналитики и таблиц
- **Redis** - кэширование, locks, rate limiting

### Критически важно

1. При ЛЮБОЙ мутации в MongoDB → синхронизация в ClickHouse
2. Таблицы на фронтенде ВСЕГДА читают из ClickHouse, НИКОГДА из MongoDB
3. Данные в ClickHouse должны быть денормализованы (имена, email, коды - не только ID)

## NestJS Best Practices

### Структура модулей

```
module/
├── dto/
│   ├── create-entity.dto.ts
│   ├── update-entity.dto.ts
│   └── query-entity.dto.ts
├── schemas/
│   └── entity.schema.ts
├── entity.controller.ts
├── entity.service.ts
└── entity.module.ts
```

### DTO и валидация

- Используй `class-validator` декораторы для ВСЕХ полей
- Обязательные декораторы: `@IsString()`, `@IsEmail()`, `@IsNumber()`, `@IsPositive()`, `@MinLength()`, `@MaxLength()`
- Для вложенных объектов: `@ValidateNested()` + `@Type()`
- Для опциональных полей: `@IsOptional()`
- Swagger декораторы: `@ApiProperty()`, `@ApiPropertyOptional()`

### Mongoose схемы

- Всегда используй TypeScript интерфейсы + схемы
- `passwordHash` должен иметь `select: false`
- Добавляй timestamps: `{ timestamps: true }`
- Используй индексы для часто запрашиваемых полей

### JWT Authentication

- Access token: 15 минут
- Refresh token: 7 дней
- Храни refresh токены в Redis или MongoDB
- Используй `@UseGuards(JwtAuthGuard)` для защиты endpoints

### ClickHouse

- **ВСЕГДА параметризуй запросы** - используй `query_params`
- НИКОГДА не используй строковую интерполяцию для пользовательского ввода
- Таблицы создаются автоматически при старте приложения
- Используй `MergeTree` engine для всех таблиц
- Добавляй `ORDER BY` для оптимизации

Пример параметризованного запроса:

```typescript
await clickhouse.query({
	query: 'SELECT * FROM users WHERE email = {email:String}',
	query_params: { email: userEmail },
})
```

### Redis использование

Минимум 2 use-case:

1. **Distributed Lock** (при применении промокода):

```typescript
const lock = await redis.set(`lock:promocode:${code}`, 'locked', 'NX', 'EX', 10)
if (!lock) throw new ConflictException('Промокод уже применяется')
```

2. **Кэширование** (аналитические запросы):

```typescript
const cacheKey = `analytics:users:${page}:${sortBy}`
const cached = await redis.get(cacheKey)
if (cached) return JSON.parse(cached)
// ... запрос к ClickHouse
await redis.setex(cacheKey, 60, JSON.stringify(result))
```

3. **Rate Limiting** (используй `@nestjs/throttler`):

```typescript
@Throttle({ default: { limit: 5, ttl: 60000 } })
@Post('apply-promocode')
```

### Синхронизация MongoDB → ClickHouse

После каждой мутации:

```typescript
// 1. Сохранить в MongoDB
const user = await this.userModel.create(createUserDto)

// 2. Синхронизировать в ClickHouse
try {
	await this.clickhouseService.insertUser({
		id: user._id.toString(),
		email: user.email,
		name: user.name,
		phone: user.phone,
		isActive: user.isActive,
		createdAt: user.createdAt,
	})
} catch (error) {
	// Логировать, но не блокировать основную операцию
	console.error('ClickHouse sync failed:', error)
}

return user
```

### Обработка ошибок

- Используй встроенные NestJS exceptions: `NotFoundException`, `BadRequestException`, `UnauthorizedException`, `ConflictException`
- Возвращай понятные сообщения об ошибках
- Логируй ошибки синхронизации, но не блокируй основную операцию

### Валидация промокода

Проверяй ВСЕ условия:

1. Промокод существует и активен
2. Срок действия (если указан `dateFrom`/`dateTo`)
3. Общий лимит использований не превышен
4. Лимит на пользователя не превышен
5. Промокод еще не применен к этому заказу
6. Заказ принадлежит текущему пользователю

### Применение промокода (два отдельных действия)

1. `POST /orders` - создание заказа (сумма, пользователь)
2. `POST /orders/:id/apply-promocode` - применение промокода к существующему заказу

НЕ совмещай эти операции в одном endpoint!

### TypeScript

- Strict mode включен - используй его
- НЕТ `any` в бизнес-логике
- Используй `unknown` для catch блоков
- Типизируй ВСЕ DTO, интерфейсы, ClickHouse ответы
- Используй дженерики где уместно

### Swagger документация

- `@ApiTags()` для группировки endpoints
- `@ApiOperation()` для описания операции
- `@ApiResponse()` для возможных ответов
- `@ApiBearerAuth()` для защищенных endpoints
- Примеры в `@ApiProperty({ example: '...' })`

## Команды для разработки

```bash
# Установка зависимостей
pnpm install

# Разработка
pnpm run start:dev

# Сборка
pnpm run build

# Продакшн
pnpm run start:prod

# Линтинг
pnpm run lint
```

## Checklist перед коммитом

- [ ] Все DTO имеют валидацию
- [ ] ClickHouse запросы параметризованы
- [ ] Синхронизация MongoDB → ClickHouse работает
- [ ] Redis используется минимум в 2 местах
- [ ] Нет `any` в коде
- [ ] Swagger аннотации добавлены
- [ ] `passwordHash` скрыт (`select: false`)
- [ ] Ошибки обрабатываются корректно
