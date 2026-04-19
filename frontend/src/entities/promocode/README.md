# Promocode Entity

Entity для работы с промокодами согласно Feature-Sliced Design архитектуре.

## Структура

```
promocode/
├── api/
│   ├── hooks/
│   │   └── usePromocodesAnalytics.ts    # Хук для получения аналитики промокодов
│   ├── promocodeApi.ts                   # CRUD API методы
│   └── query-keys.ts                     # Query keys для TanStack Query
├── model/
│   └── types.ts                          # TypeScript интерфейсы
├── index.ts                              # Публичные экспорты
└── README.md                             # Документация
```

## Типы

### Promocode

Основная entity промокода из MongoDB.

```typescript
interface Promocode {
	_id: string
	code: string
	discount: number
	totalLimit: number
	userLimit: number
	dateFrom?: string
	dateTo?: string
	isActive: boolean
	createdAt: string
	updatedAt: string
}
```

### PromocodeFormData

Данные формы для создания/редактирования промокода.

```typescript
interface PromocodeFormData {
	code: string
	discount: number
	totalLimit: number
	userLimit: number
	dateTo?: string
	dateFrom?: string
}
```

    expiration: string
    dateFrom?: string

}

````

### CreatePromocodeDTO

DTO для создания промокода (отправляется на backend).

### UpdatePromocodeDTO

DTO для обновления промокода (отправляется на backend).

## API

### promocodeApi

CRUD операции для работы с промокодами в MongoDB:

- `create(data)` - Создать промокод
- `update(id, data)` - Обновить промокод
- `deactivate(id)` - Деактивировать промокод
- `getById(id)` - Получить промокод по ID
- `getAll()` - Получить все промокоды

### Query Keys

Структурированные ключи для TanStack Query:

```typescript
promocodeKeys.all // ['promocodes']
promocodeKeys.lists() // ['promocodes', 'list']
promocodeKeys.list(filters) // ['promocodes', 'list', filters]
promocodeKeys.details() // ['promocodes', 'detail']
promocodeKeys.detail(id) // ['promocodes', 'detail', id]
promocodeKeys.analytics() // ['analytics', 'promocodes']
promocodeKeys.analyticsWithParams(params) // ['analytics', 'promocodes', params]
````

## Hooks

### usePromocodesAnalytics

Хук для получения аналитических данных промокодов из ClickHouse.

```typescript
const { data, isLoading, isError } = usePromocodesAnalytics({
	page: 1,
	pageSize: 10,
	sortBy: 'createdAt',
	sortOrder: SortOrder.DESC,
})
```

## Использование

```typescript
import {
	promocodeApi,
	promocodeKeys,
	usePromocodesAnalytics,
	type Promocode,
	type PromocodeFormData,
	type CreatePromocodeDTO,
	type UpdatePromocodeDTO,
} from '@/entities/promocode'

// Создание промокода
const newPromocode = await promocodeApi.create({
	code: 'SUMMER2024',
	discount: 20,
	totalLimit: 100,
	userLimit: 1,
	dateTo: '2024-12-31',
})

// Получение аналитики
const { data } = usePromocodesAnalytics({
	page: 1,
	pageSize: 10,
	sortBy: 'totalRevenue',
	sortOrder: SortOrder.DESC,
})
```

## Связь с другими entities

- `analytics` - Использует AnalyticsPromocode тип и analyticsApi для получения данных из ClickHouse
- Промокоды записываются в MongoDB через promocodeApi
- Промокоды читаются из ClickHouse через analyticsApi для аналитики
