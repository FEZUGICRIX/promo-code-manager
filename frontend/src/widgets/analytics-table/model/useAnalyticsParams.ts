import { useSearchParams } from 'react-router-dom'
import { useCallback, useMemo } from 'react'
import { BaseAnalyticsParams, SortOrder } from '@/entities/analytics'

/**
 * Custom hook для синхронизации параметров аналитики с URL Query-параметрами
 *
 * @template T - Тип параметров, расширяющий BaseAnalyticsParams
 * @param defaultParams - Значения параметров по умолчанию
 * @returns Объект с текущими параметрами и функциями для их обновления
 *
 * @example
 * ```tsx
 * const { params, setParams, resetParams } = useAnalyticsParams({
 *   page: 1,
 *   pageSize: 10,
 *   sortBy: 'createdAt',
 *   sortOrder: SortOrder.DESC
 * })
 *
 * // Обновить параметры
 * setParams({ page: 2 })
 *
 * // Сбросить все параметры
 * resetParams()
 * ```
 */
export function useAnalyticsParams<T extends BaseAnalyticsParams>(
	defaultParams: T,
): {
	params: T
	setParams: (updates: Partial<T> | ((prev: T) => Partial<T>)) => void
	resetParams: () => void
} {
	const [searchParams, setSearchParams] = useSearchParams()

	/**
	 * Парсинг параметров из URL с валидацией и fallback к значениям по умолчанию
	 */
	const params = useMemo(() => {
		try {
			const parsed: any = { ...defaultParams }

			// Парсинг числовых параметров
			const page = searchParams.get('page')
			if (page) {
				const pageNum = parseInt(page, 10)
				if (!isNaN(pageNum) && pageNum > 0) {
					parsed.page = pageNum
				}
			}

			const pageSize = searchParams.get('pageSize')
			if (pageSize) {
				const pageSizeNum = parseInt(pageSize, 10)
				if (!isNaN(pageSizeNum) && pageSizeNum > 0) {
					parsed.pageSize = pageSizeNum
				}
			}

			// Парсинг строковых параметров
			const search = searchParams.get('search')
			if (search) {
				parsed.search = search
			}

			const sortBy = searchParams.get('sortBy')
			if (sortBy) {
				parsed.sortBy = sortBy
			}

			// Парсинг enum параметров (sortOrder)
			const sortOrder = searchParams.get('sortOrder')
			if (sortOrder && (sortOrder === 'ASC' || sortOrder === 'DESC')) {
				parsed.sortOrder = sortOrder as SortOrder
			}

			// Парсинг дат (ISO string format)
			const dateFrom = searchParams.get('dateFrom')
			if (dateFrom) {
				parsed.dateFrom = dateFrom
			}

			const dateTo = searchParams.get('dateTo')
			if (dateTo) {
				parsed.dateTo = dateTo
			}

			// Парсинг boolean параметров (isActive)
			const isActive = searchParams.get('isActive')
			if (isActive !== null) {
				parsed.isActive = isActive === 'true'
			}

			return parsed as T
		} catch (error) {
			console.error('Error parsing URL params:', error)
			return defaultParams
		}
	}, [searchParams, defaultParams])

	/**
	 * Обновление параметров с автоматическим обновлением URL
	 * Поддерживает functional update для доступа к предыдущим значениям
	 */
	const setParams = useCallback(
		(updates: Partial<T> | ((prev: T) => Partial<T>)) => {
			setSearchParams((prev) => {
				// Получаем текущие параметры
				const currentParams = { ...defaultParams }
				prev.forEach((value, key) => {
					;(currentParams as any)[key] = value
				})

				// Вычисляем обновления (поддержка functional update)
				const resolvedUpdates =
					typeof updates === 'function' ? updates(currentParams as T) : updates

				const newParams = new URLSearchParams(prev)

				// Применяем обновления
				Object.entries(resolvedUpdates).forEach(([key, value]) => {
					if (value === undefined || value === null || value === '') {
						newParams.delete(key)
					} else {
						newParams.set(key, String(value))
					}
				})

				// Удаляем параметры со значениями по умолчанию
				if (newParams.get('page') === String(defaultParams.page)) {
					newParams.delete('page')
				}
				if (newParams.get('pageSize') === String(defaultParams.pageSize)) {
					newParams.delete('pageSize')
				}
				if (newParams.get('sortOrder') === String(defaultParams.sortOrder)) {
					newParams.delete('sortOrder')
				}

				return newParams
			})
		},
		[setSearchParams, defaultParams],
	)

	/**
	 * Сброс всех параметров к значениям по умолчанию
	 */
	const resetParams = useCallback(() => {
		setSearchParams({})
	}, [setSearchParams])

	return { params, setParams, resetParams }
}
