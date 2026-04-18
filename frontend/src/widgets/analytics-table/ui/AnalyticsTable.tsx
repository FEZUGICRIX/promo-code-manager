import { ColumnDef } from '@tanstack/react-table'
import { DataTable } from '@/shared/ui/data-table/DataTable'
import { SearchInput } from '@/features/search-analytics'
import { DateRangePicker } from '@/features/filter-by-date'
import { useAnalyticsParams } from '../model/useAnalyticsParams'
import { useAnalyticsQuery } from '@/entities/analytics'
import type { BaseAnalyticsParams } from '@/entities/analytics'

/**
 * Props для компонента AnalyticsTable
 *
 * @template TData - Тип данных строк таблицы
 * @template TParams - Тип параметров запроса (расширяет BaseAnalyticsParams)
 *
 * **Validates: Requirements 9.1, 9.2, 9.3, 9.4, 9.5**
 */
interface AnalyticsTableProps<TData, TParams extends BaseAnalyticsParams> {
	/** API endpoint для загрузки данных */
	endpoint: string
	/** Определение колонок таблицы в формате TanStack Table */
	columns: ColumnDef<TData>[]
	/** Значения параметров по умолчанию */
	defaultParams: TParams
	/** Сообщение при отсутствии данных */
	emptyMessage?: string
	/** Placeholder для поля поиска */
	searchPlaceholder?: string
	/** Показывать ли фильтр по датам */
	showDateFilter?: boolean
	/** Показывать ли поле поиска */
	showSearch?: boolean
}

/**
 * Универсальный виджет таблицы аналитики
 *
 * Композиционный компонент, объединяющий:
 * - DataTable (таблица с пагинацией и сортировкой)
 * - SearchInput (поиск с debounce)
 * - DateRangePicker (выбор диапазона дат)
 * - useAnalyticsParams (синхронизация с URL)
 * - useAnalyticsQuery (загрузка данных)
 *
 * @example
 * ```tsx
 * <AnalyticsTable
 *   endpoint="/analytics/users"
 *   columns={usersColumns}
 *   defaultParams={{
 *     page: 1,
 *     pageSize: 10,
 *     sortBy: 'createdAt',
 *     sortOrder: SortOrder.DESC
 *   }}
 *   emptyMessage="Пользователи не найдены"
 *   searchPlaceholder="Поиск по имени, email..."
 *   showDateFilter
 *   showSearch
 * />
 * ```
 *
 * **Validates: Requirements 9.1, 9.2, 9.3, 9.4, 9.5**
 */
export function AnalyticsTable<TData, TParams extends BaseAnalyticsParams>({
	endpoint,
	columns,
	defaultParams,
	emptyMessage = 'Данные не найдены',
	searchPlaceholder = 'Поиск...',
	showDateFilter = true,
	showSearch = true,
}: AnalyticsTableProps<TData, TParams>) {
	// Синхронизация параметров с URL
	const { params, setParams } = useAnalyticsParams<TParams>(defaultParams)

	// Загрузка данных через TanStack Query
	const { data, isLoading, isError, error, refetch } = useAnalyticsQuery<TData, TParams>(
		endpoint,
		params,
	)

	/**
	 * Обработчик изменения поиска
	 * Сбрасывает страницу на 1 при изменении поискового запроса
	 */
	const handleSearchChange = (search: string) => {
		setParams({ search: search || undefined, page: 1 } as unknown as Partial<TParams>)
	}

	/**
	 * Обработчик изменения диапазона дат
	 * Сбрасывает страницу на 1 при изменении дат
	 */
	const handleDateRangeChange = (dateFrom: string | undefined, dateTo: string | undefined) => {
		setParams({ dateFrom, dateTo, page: 1 } as unknown as Partial<TParams>)
	}

	/**
	 * Обработчик изменения пагинации
	 */
	const handlePaginationChange = (page: number, pageSize: number) => {
		setParams({ page, pageSize } as unknown as Partial<TParams>)
	}

	/**
	 * Обработчик изменения сортировки
	 */
	const handleSortingChange = (sortBy: string, sortOrder: 'ASC' | 'DESC') => {
		setParams({ sortBy, sortOrder } as unknown as Partial<TParams>)
	}

	return (
		<div className='space-y-6'>
			{/* Header с фильтрами */}
			{(showSearch || showDateFilter) && (
				<div className='space-y-4'>
					{/* Поиск */}
					{showSearch && (
						<div className='w-full md:w-96'>
							<SearchInput
								value={params.search || ''}
								onChange={handleSearchChange}
								placeholder={searchPlaceholder}
							/>
						</div>
					)}

					{/* Фильтр по датам */}
					{showDateFilter && (
						<DateRangePicker
							dateFrom={params.dateFrom}
							dateTo={params.dateTo}
							onChange={handleDateRangeChange}
						/>
					)}
				</div>
			)}

			{/* Таблица с данными */}
			<DataTable
				columns={columns}
				data={data?.data || []}
				isLoading={isLoading}
				isError={isError}
				error={error}
				pagination={{
					page: params.page,
					pageSize: params.pageSize,
					total: data?.total || 0,
				}}
				onPaginationChange={handlePaginationChange}
				sorting={{
					sortBy: (params as any).sortBy || '',
					sortOrder: params.sortOrder,
				}}
				onSortingChange={handleSortingChange}
				onRetry={refetch}
				emptyMessage={emptyMessage}
			/>
		</div>
	)
}
