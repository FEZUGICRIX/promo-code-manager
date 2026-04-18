# Entities: Analytics

Бизнес-сущность "Аналитика" в архитектуре Feature-Sliced Design. Содержит типы данных, API-слой и хуки для работы с аналитическими данными.

## Структура

```
entities/analytics/
├── model/              # Типы данных
│   └── types.ts
├── api/                # API-слой
│   ├── query-keys.ts
│   └── analytics.service.ts
├── lib/                # Хуки и логика
│   └── useAnalyticsQuery.ts
└── index.ts            # Публичный API
```

## Типы данных

### Базовые типы

#### `SortOrder`

Enum для направления сортировки:

```typescript
enum SortOrder {
	ASC = 'ASC',
	DESC = 'DESC',
}
```

#### `BaseAnalyticsParams`

Базовые параметры для всех аналитических запросов:

```typescript
interface BaseAnalyticsParams {
	page: number
	pageSize: number
	search?: string
	sortOrder: SortOrder
	dateFrom?: string // ISO date string (yyyy-MM-dd)
	dateTo?: string // ISO date string (yyyy-MM-dd)
}
```

#### `PaginatedResponse<T>`

Generic интерфейс для пагинированного ответа от API:

```typescript
interface PaginatedResponse<T> {
	data: T[]
	total: number
	page: number
	pageSize: number
}
```

### Типы для Users Analytics

```typescript
// Допустимые колонки для сортировки
const USERS_SORT_COLUMNS = [
	'id',
	'name',
	'email',
	'phone',
	'isActive',
	'createdAt',
	'totalOrders',
	'totalSpent',
	'totalDiscount',
	'promoUsagesCount',
] as const

type UsersSortColumn = (typeof USERS_SORT_COLUMNS)[number]

// Параметры запроса
interface UsersAnalyticsParams extends BaseAnalyticsParams {
	sortBy: UsersSortColumn
	isActive?: boolean
}

// Данные пользователя
interface AnalyticsUser {
	id: string
	name: string
	email: string
	phone: string
	isActive: boolean
	createdAt: string
	totalOrders: number
	totalSpent: number
	totalDiscount: number
	promoUsagesCount: number
}
```

### Типы для Promocodes Analytics

```typescript
// Допустимые колонки для сортировки
const PROMOCODES_SORT_COLUMNS = [
	'id',
	'code',
	'discount',
	'totalLimit',
	'userLimit',
	'isActive',
	'createdAt',
	'usageCount',
	'totalRevenue',
	'uniqueUsers',
	'totalDiscount',
] as const

type PromocodesSortColumn = (typeof PROMOCODES_SORT_COLUMNS)[number]

// Параметры запроса
interface PromocodesAnalyticsParams extends BaseAnalyticsParams {
	sortBy: PromocodesSortColumn
	isActive?: boolean
}

// Данные промокода
interface AnalyticsPromocode {
	id: string
	code: string
	discount: number
	totalLimit: number
	userLimit: number
	isActive: boolean
	createdAt: string
	usageCount: number
	totalRevenue: number
	uniqueUsers: number
	totalDiscount: number
}
```

### Типы для Promo Usages Analytics

```typescript
// Допустимые колонки для сортировки
const PROMO_USAGES_SORT_COLUMNS = [
	'id',
	'promocodeCode',
	'promocodeDiscount',
	'userName',
	'userEmail',
	'orderId',
	'orderAmount',
	'discountAmount',
	'createdAt',
] as const

type PromoUsagesSortColumn = (typeof PROMO_USAGES_SORT_COLUMNS)[number]

// Параметры запроса
interface PromoUsagesAnalyticsParams extends BaseAnalyticsParams {
	sortBy: PromoUsagesSortColumn
}

// Данные использования промокода
interface AnalyticsPromoUsage {
	id: string
	promocodeCode: string
	promocodeDiscount: number
	userName: string
	userEmail: string
	orderId: string
	orderAmount: number
	discountAmount: number
	createdAt: string
}
```

## Хук useAnalyticsQuery

Generic хук для запросов аналитических данных с использованием TanStack Query.

### Сигнатура

```typescript
function useAnalyticsQuery<TData, TParams extends BaseAnalyticsParams>(
	endpoint: string,
	params: TParams,
	options?: UseQueryOptions<PaginatedResponse<TData>>,
)
```

### Параметры

- `endpoint` - API endpoint (например, `/analytics/users`)
- `params` - Параметры запроса (page, pageSize, search, sortBy, sortOrder, dateFrom, dateTo)
- `options` - Дополнительные опции для TanStack Query

### Возвращаемое значение

Объект с полями из TanStack Query:

- `data` - Данные ответа типа `PaginatedResponse<TData>`
- `isLoading` - Флаг загрузки
- `isError` - Флаг ошибки
- `error` - Объект ошибки
- `refetch` - Функция для повторного запроса

### Примеры использования

#### Запрос данных пользователей

```typescript
import { useAnalyticsQuery, SortOrder } from '@/entities/analytics'
import type { AnalyticsUser, UsersAnalyticsParams } from '@/entities/analytics'

function UsersAnalyticsPage() {
  const { data, isLoading, isError, error, refetch } = useAnalyticsQuery<
    AnalyticsUser,
    UsersAnalyticsParams
  >('/analytics/users', {
    page: 1,
    pageSize: 10,
    sortBy: 'createdAt',
    sortOrder: SortOrder.DESC,
    search: 'john',
    isActive: true,
    dateFrom: '2024-01-01',
    dateTo: '2024-01-31'
  })

  if (isLoading) return <div>Загрузка...</div>
  if (isError) return <div>Ошибка: {error.message}</div>

  return (
    <div>
      <h1>Найдено пользователей: {data.total}</h1>
      <ul>
        {data.data.map(user => (
          <li key={user.id}>{user.name} - {user.email}</li>
        ))}
      </ul>
    </div>
  )
}
```

#### Запрос данных промокодов

```typescript
import { useAnalyticsQuery, SortOrder } from '@/entities/analytics'
import type { AnalyticsPromocode, PromocodesAnalyticsParams } from '@/entities/analytics'

function PromocodesAnalyticsPage() {
  const { data, isLoading } = useAnalyticsQuery<
    AnalyticsPromocode,
    PromocodesAnalyticsParams
  >('/analytics/promocodes', {
    page: 1,
    pageSize: 25,
    sortBy: 'usageCount',
    sortOrder: SortOrder.DESC,
    isActive: true
  })

  if (isLoading) return <div>Загрузка...</div>

  return (
    <div>
      {data.data.map(promo => (
        <div key={promo.id}>
          <h3>{promo.code}</h3>
          <p>Скидка: {promo.discount}%</p>
          <p>Использований: {promo.usageCount}</p>
        </div>
      ))}
    </div>
  )
}
```

#### Запрос истории использований промокодов

```typescript
import { useAnalyticsQuery, SortOrder } from '@/entities/analytics'
import type { AnalyticsPromoUsage, PromoUsagesAnalyticsParams } from '@/entities/analytics'

function PromoUsagesPage() {
  const { data, isLoading } = useAnalyticsQuery<
    AnalyticsPromoUsage,
    PromoUsagesAnalyticsParams
  >('/analytics/promo-usages', {
    page: 1,
    pageSize: 50,
    sortBy: 'createdAt',
    sortOrder: SortOrder.DESC,
    search: 'SUMMER2024'
  })

  if (isLoading) return <div>Загрузка...</div>

  return (
    <table>
      <thead>
        <tr>
          <th>Промокод</th>
          <th>Пользователь</th>
          <th>Сумма заказа</th>
          <th>Скидка</th>
        </tr>
      </thead>
      <tbody>
        {data.data.map(usage => (
          <tr key={usage.id}>
            <td>{usage.promocodeCode}</td>
            <td>{usage.userName}</td>
            <td>{usage.orderAmount}</td>
            <td>{usage.discountAmount}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}
```

#### С дополнительными опциями TanStack Query

```typescript
const { data, isLoading } = useAnalyticsQuery<AnalyticsUser, UsersAnalyticsParams>(
	'/analytics/users',
	params,
	{
		// Кэширование на 5 минут
		staleTime: 5 * 60 * 1000,
		// Автоматическое обновление при фокусе окна
		refetchOnWindowFocus: true,
		// Повторные попытки при ошибке
		retry: 3,
		// Включить запрос только при определенном условии
		enabled: isAuthenticated,
	},
)
```

## API утилиты

### `createAnalyticsQueryKey`

Создает query key для TanStack Query на основе endpoint и параметров.

```typescript
function createAnalyticsQueryKey(endpoint: string, params: any): [string, string, any]
```

**Пример:**

```typescript
import { createAnalyticsQueryKey } from '@/entities/analytics'

const queryKey = createAnalyticsQueryKey('/analytics/users', {
	page: 1,
	pageSize: 10,
})
// ['analytics', '/analytics/users', { page: 1, pageSize: 10 }]
```

### `cleanParams`

Удаляет undefined и пустые значения из объекта параметров перед отправкой в API.

```typescript
function cleanParams<T extends Record<string, any>>(params: T): Partial<T>
```

**Пример:**

```typescript
import { cleanParams } from '@/entities/analytics'

const params = {
	page: 1,
	search: '',
	name: undefined,
	email: 'test@example.com',
}

const cleaned = cleanParams(params)
// { page: 1, email: 'test@example.com' }
```

## Работа с типами

### Типобезопасность при создании параметров

```typescript
import { SortOrder, UsersAnalyticsParams } from '@/entities/analytics'

// ✅ Корректно - все обязательные поля присутствуют
const params: UsersAnalyticsParams = {
	page: 1,
	pageSize: 10,
	sortBy: 'createdAt',
	sortOrder: SortOrder.DESC,
}

// ❌ Ошибка TypeScript - отсутствует sortBy
const invalidParams: UsersAnalyticsParams = {
	page: 1,
	pageSize: 10,
	sortOrder: SortOrder.DESC,
}

// ❌ Ошибка TypeScript - неверное значение sortBy
const invalidSortBy: UsersAnalyticsParams = {
	page: 1,
	pageSize: 10,
	sortBy: 'invalidColumn', // Ошибка: не входит в UsersSortColumn
	sortOrder: SortOrder.DESC,
}
```

### Использование union типов для sortBy

```typescript
import { USERS_SORT_COLUMNS, UsersSortColumn } from '@/entities/analytics'

// Получить все допустимые колонки
const columns = USERS_SORT_COLUMNS
// ['id', 'name', 'email', 'phone', 'isActive', 'createdAt', ...]

// Проверка валидности колонки
function isValidUserColumn(column: string): column is UsersSortColumn {
	return USERS_SORT_COLUMNS.includes(column as UsersSortColumn)
}

// Использование в компоненте
const sortBy = 'name'
if (isValidUserColumn(sortBy)) {
	// TypeScript знает, что sortBy имеет тип UsersSortColumn
	const params: UsersAnalyticsParams = {
		page: 1,
		pageSize: 10,
		sortBy, // ✅ Типобезопасно
		sortOrder: SortOrder.DESC,
	}
}
```

### Generic функции с типами аналитики

```typescript
import type { BaseAnalyticsParams, PaginatedResponse } from '@/entities/analytics'

// Generic функция для обработки любых аналитических данных
function processAnalyticsData<T, P extends BaseAnalyticsParams>(
	data: PaginatedResponse<T>,
	params: P,
): T[] {
	console.log(`Обработка ${data.total} записей`)
	console.log(`Страница ${params.page}, размер ${params.pageSize}`)
	return data.data
}

// Использование с разными типами
const users = processAnalyticsData<AnalyticsUser, UsersAnalyticsParams>(usersData, usersParams)

const promocodes = processAnalyticsData<AnalyticsPromocode, PromocodesAnalyticsParams>(
	promocodesData,
	promocodesParams,
)
```

## Интеграция с TanStack Query

### Кэширование и инвалидация

```typescript
import { useQueryClient } from '@tanstack/react-query'
import { createAnalyticsQueryKey } from '@/entities/analytics'

function MyComponent() {
  const queryClient = useQueryClient()

  // Инвалидация кэша для конкретного запроса
  const invalidateUsers = () => {
    queryClient.invalidateQueries({
      queryKey: createAnalyticsQueryKey('/analytics/users', params)
    })
  }

  // Инвалидация всех аналитических запросов
  const invalidateAllAnalytics = () => {
    queryClient.invalidateQueries({
      queryKey: ['analytics']
    })
  }

  // Предзагрузка данных
  const prefetchNextPage = () => {
    queryClient.prefetchQuery({
      queryKey: createAnalyticsQueryKey('/analytics/users', {
        ...params,
        page: params.page + 1
      }),
      queryFn: () => fetchUsers({ ...params, page: params.page + 1 })
    })
  }

  return <div>...</div>
}
```

### Оптимистичные обновления

```typescript
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createAnalyticsQueryKey } from '@/entities/analytics'

function useUpdateUser() {
	const queryClient = useQueryClient()

	return useMutation({
		mutationFn: updateUser,
		onMutate: async (updatedUser) => {
			// Отменяем текущие запросы
			await queryClient.cancelQueries({
				queryKey: ['analytics', '/analytics/users'],
			})

			// Сохраняем предыдущее состояние
			const previousData = queryClient.getQueryData(
				createAnalyticsQueryKey('/analytics/users', params),
			)

			// Оптимистично обновляем кэш
			queryClient.setQueryData(
				createAnalyticsQueryKey('/analytics/users', params),
				(old: PaginatedResponse<AnalyticsUser>) => ({
					...old,
					data: old.data.map((user) => (user.id === updatedUser.id ? updatedUser : user)),
				}),
			)

			return { previousData }
		},
		onError: (err, updatedUser, context) => {
			// Откатываем изменения при ошибке
			queryClient.setQueryData(
				createAnalyticsQueryKey('/analytics/users', params),
				context?.previousData,
			)
		},
		onSettled: () => {
			// Обновляем данные после завершения
			queryClient.invalidateQueries({
				queryKey: ['analytics', '/analytics/users'],
			})
		},
	})
}
```

## Связанные модули

- `widgets/analytics-table` - Виджет таблицы аналитики, использующий эти типы и хуки
- `shared/ui/data-table` - Базовый компонент таблицы
- `features/search-analytics` - Компонент поиска
- `features/filter-by-date` - Компонент фильтрации по датам

## Требования

Модуль валидирует следующие требования из спецификации:

- **6.1-6.8**: Типизация параметров запросов для всех Backend DTO
- **8.1-8.7**: Интеграция с TanStack Query для управления состоянием
- **9.1-9.8**: Переиспользуемость компонентов и типов
