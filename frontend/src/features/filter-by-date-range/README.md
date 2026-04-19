# DateRangeFilter Feature

Компонент для фильтрации данных по диапазону дат с поддержкой пресетов.

## Возможности

- 📅 Пресеты: Сегодня, Последние 7 дней, Последние 30 дней
- 🎯 Произвольный выбор диапазона дат
- 🔄 Автоматическое форматирование дат в ISO формат (yyyy-MM-dd)
- 🎨 Адаптивный дизайн

## Использование

### Базовый пример

```tsx
import { DateRangeFilter, useDateRangeFilter, DatePreset } from '@/features/filter-by-date-range'

function MyTable() {
	const { preset, dateRange, handlePresetChange, handleCustomDateChange } = useDateRangeFilter(
		DatePreset.LAST_30_DAYS,
	)

	// Синхронизация с параметрами запроса
	useEffect(() => {
		setParams({
			dateFrom: dateRange.dateFrom,
			dateTo: dateRange.dateTo,
			page: 1,
		})
	}, [dateRange, setParams])

	return (
		<DataTable
			// ... other props
			filters={
				<DateRangeFilter
					preset={preset}
					dateRange={dateRange}
					onPresetChange={handlePresetChange}
					onCustomDateChange={handleCustomDateChange}
				/>
			}
		/>
	)
}
```

### Интеграция с аналитическими таблицами

Все аналитические таблицы должны поддерживать параметры `dateFrom` и `dateTo` в `BaseAnalyticsParams`:

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

### Пример для новой таблицы

```tsx
import { useEffect } from 'react'
import { DataTable } from '@/shared/ui/data-table/DataTable'
import { DateRangeFilter, useDateRangeFilter, DatePreset } from '@/features/filter-by-date-range'
import { useAnalyticsParams } from '@/widgets/analytics-table'

export function PromocodesAnalyticsTable() {
	const { params, setParams } = useAnalyticsParams(DEFAULT_PARAMS)
	const { data, isLoading, isError, error, refetch } = usePromocodesAnalytics(params)

	// Date range filter
	const { preset, dateRange, handlePresetChange, handleCustomDateChange } = useDateRangeFilter(
		DatePreset.LAST_30_DAYS,
	)

	// Sync date range with params
	useEffect(() => {
		setParams({
			dateFrom: dateRange.dateFrom,
			dateTo: dateRange.dateTo,
			page: 1,
		})
	}, [dateRange, setParams])

	return (
		<DataTable
			columns={columns}
			data={data?.data ?? []}
			isLoading={isLoading}
			isError={isError}
			error={error}
			pagination={{
				page: params.page,
				pageSize: params.pageSize,
				total: data?.total ?? 0,
			}}
			onPaginationChange={(page, pageSize) => setParams({ page, pageSize })}
			filters={
				<DateRangeFilter
					preset={preset}
					dateRange={dateRange}
					onPresetChange={handlePresetChange}
					onCustomDateChange={handleCustomDateChange}
				/>
			}
		/>
	)
}
```

## API

### `useDateRangeFilter(initialPreset?: DatePreset)`

Хук для управления состоянием фильтра по датам.

**Параметры:**

- `initialPreset` - начальный пресет (по умолчанию `DatePreset.LAST_30_DAYS`)

**Возвращает:**

- `preset` - текущий выбранный пресет
- `dateRange` - текущий диапазон дат `{ dateFrom?: string, dateTo?: string }`
- `handlePresetChange` - функция для изменения пресета
- `handleCustomDateChange` - функция для изменения произвольного диапазона
- `reset` - функция для сброса к начальному состоянию

### `DateRangeFilter`

Компонент UI для отображения фильтра.

**Props:**

- `preset` - текущий пресет
- `dateRange` - текущий диапазон дат
- `onPresetChange` - callback при изменении пресета
- `onCustomDateChange` - callback при изменении произвольного диапазона

### `DatePreset`

Enum с доступными пресетами:

- `TODAY` - сегодня
- `LAST_7_DAYS` - последние 7 дней
- `LAST_30_DAYS` - последние 30 дней
- `CUSTOM` - произвольный диапазон

## Backend Integration

Backend должен принимать параметры `dateFrom` и `dateTo` в формате `yyyy-MM-dd` и фильтровать данные по полю `createdAt`:

```typescript
// NestJS DTO example
export class AnalyticsQueryDto {
  @IsOptional()
  @IsDateString()
  dateFrom?: string // yyyy-MM-dd format

  @IsOptional()
  @IsDateString()
  dateTo?: string // yyyy-MM-dd format
}

// DateRangeHelper automatically converts:
// dateFrom: "2026-04-19" → "2026-04-19 00:00:00" (start of day)
// dateTo: "2026-04-19" → "2026-04-19 23:59:59" (end of day)

// ClickHouse query example
WHERE createdAt >= {dateFrom:DateTime} AND createdAt <= {dateTo:DateTime}
```
