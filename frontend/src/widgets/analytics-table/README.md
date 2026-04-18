# AnalyticsTable Widget

Универсальный виджет для отображения аналитических таблиц с полной поддержкой фильтрации, пагинации, сортировки и синхронизации с URL.

## Возможности

- 📊 **Универсальная таблица**: Generic компонент для любых аналитических данных
- 🔍 **Поиск с debounce**: Оптимизированный поиск с задержкой 300ms
- 📅 **Фильтр по датам**: Выбор диапазона дат с пресетами
- 🔗 **URL синхронизация**: Все параметры сохраняются в URL для шаринга
- 📄 **Пагинация**: Навигация по страницам с выбором размера страницы
- ⬆️⬇️ **Сортировка**: Клик на заголовок колонки для сортировки
- ⚡ **TanStack Query**: Автоматическое кэширование и управление состоянием

## Использование

### Базовый пример

```tsx
import { AnalyticsTable } from '@/widgets/analytics-table'
import { SortOrder, type UsersAnalyticsParams, type AnalyticsUser } from '@/entities/analytics'
import { ColumnDef } from '@tanstack/react-table'

// Определение колонок таблицы
const columns: ColumnDef<AnalyticsUser>[] = [
	{
		accessorKey: 'name',
		header: 'Имя',
		enableSorting: true,
	},
	{
		accessorKey: 'email',
		header: 'Email',
		enableSorting: true,
	},
	{
		accessorKey: 'totalOrders',
		header: 'Заказов',
		enableSorting: true,
	},
]

// Использование компонента
export function UsersAnalyticsPage() {
	return (
		<div className='container mx-auto py-8'>
			<h1 className='text-2xl font-bold mb-6'>Аналитика пользователей</h1>

			<AnalyticsTable<AnalyticsUser, UsersAnalyticsParams>
				endpoint='/analytics/users'
				columns={columns}
				defaultParams={{
					page: 1,
					pageSize: 10,
					sortBy: 'createdAt',
					sortOrder: SortOrder.DESC,
				}}
				emptyMessage='Пользователи не найдены'
				searchPlaceholder='Поиск по имени, email, телефону...'
				showDateFilter
				showSearch
			/>
		</div>
	)
}
```

### Пример с промокодами

```tsx
import { AnalyticsTable } from '@/widgets/analytics-table'
import {
	SortOrder,
	type PromocodesAnalyticsParams,
	type AnalyticsPromocode,
} from '@/entities/analytics'

const columns: ColumnDef<AnalyticsPromocode>[] = [
	{
		accessorKey: 'code',
		header: 'Код',
		enableSorting: true,
	},
	{
		accessorKey: 'discount',
		header: 'Скидка',
		cell: ({ row }) => `${row.original.discount}%`,
		enableSorting: true,
	},
	{
		accessorKey: 'usageCount',
		header: 'Использований',
		enableSorting: true,
	},
]

export function PromocodesAnalyticsPage() {
	return (
		<AnalyticsTable<AnalyticsPromocode, PromocodesAnalyticsParams>
			endpoint='/analytics/promocodes'
			columns={columns}
			defaultParams={{
				page: 1,
				pageSize: 25,
				sortBy: 'usageCount',
				sortOrder: SortOrder.DESC,
			}}
			emptyMessage='Промокоды не найдены'
			searchPlaceholder='Поиск по коду промокода...'
		/>
	)
}
```

### Без фильтров

```tsx
<AnalyticsTable
	endpoint='/analytics/promo-usages'
	columns={columns}
	defaultParams={defaultParams}
	showDateFilter={false}
	showSearch={false}
/>
```

## Props

| Prop                | Тип                  | Обязательный | По умолчанию          | Описание                                     |
| ------------------- | -------------------- | ------------ | --------------------- | -------------------------------------------- |
| `endpoint`          | `string`             | ✅           | -                     | API endpoint для загрузки данных             |
| `columns`           | `ColumnDef<TData>[]` | ✅           | -                     | Определение колонок в формате TanStack Table |
| `defaultParams`     | `TParams`            | ✅           | -                     | Значения параметров по умолчанию             |
| `emptyMessage`      | `string`             | ❌           | `'Данные не найдены'` | Сообщение при отсутствии данных              |
| `searchPlaceholder` | `string`             | ❌           | `'Поиск...'`          | Placeholder для поля поиска                  |
| `showDateFilter`    | `boolean`            | ❌           | `true`                | Показывать ли фильтр по датам                |
| `showSearch`        | `boolean`            | ❌           | `true`                | Показывать ли поле поиска                    |

## Generic типы

- `TData` - Тип данных строк таблицы (например, `AnalyticsUser`)
- `TParams` - Тип параметров запроса, расширяющий `BaseAnalyticsParams`

## Синхронизация с URL

Все параметры фильтрации автоматически синхронизируются с URL:

```
/users?page=2&pageSize=25&search=john&sortBy=createdAt&sortOrder=DESC&dateFrom=2024-01-01&dateTo=2024-01-31
```

Это позволяет:

- Делиться ссылками с коллегами
- Использовать кнопку "Назад" в браузере
- Сохранять состояние при перезагрузке страницы

## Состояния

Компонент автоматически обрабатывает различные состояния:

- **Загрузка**: Отображает skeleton с анимацией
- **Ошибка**: Показывает сообщение об ошибке с кнопкой повтора
- **Пустые данные**: Отображает EmptyState с сообщением
- **Успех**: Показывает таблицу с данными

## Связанные компоненты

- `useAnalyticsParams` - Хук для синхронизации параметров с URL
- `useAnalyticsQuery` - Хук для загрузки данных через TanStack Query
- `DataTable` - Базовый компонент таблицы
- `SearchInput` - Компонент поиска с debounce
- `DateRangePicker` - Компонент выбора диапазона дат

## Требования

Компонент валидирует следующие требования:

- **9.1**: Generic компонент, принимающий тип данных через TypeScript generics
- **9.2**: Принимает columns definition в формате TanStack Table
- **9.3**: Принимает data, pagination state, sorting state через props
- **9.4**: Принимает callbacks для изменения pagination и sorting
- **9.5**: URL Params Hook является generic хуком
