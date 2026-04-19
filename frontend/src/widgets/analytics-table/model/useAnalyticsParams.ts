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

	// Стабилизируем defaultParams чтобы избежать бесконечных ре-рендеров
	const stableDefaults = useMemo(() => defaultParams, [])

	/**
	 * Парсинг параметров из URL с валидацией и fallback к значениям по умолчанию
	 */
	const params = useMemo(() => {
		try {
			const parsed: any = { ...stableDefaults } // TODO: убрать any!!!

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
			return stableDefaults
		}
	}, [searchParams, stableDefaults])

	/**
	 * Обновление параметров с автоматическим обновлением URL
	 * Поддерживает functional update для доступа к предыдущим значениям
	 */
	const setParams = useCallback(
		(updates: Partial<T> | ((prev: T) => Partial<T>)) => {
			setSearchParams((prev) => {
				// Получаем текущие параметры из URL, начиная с дефолтов
				const currentParams: any = { ...stableDefaults }

				// Парсим текущие значения из URL (перезаписываем дефолты)
				const page = prev.get('page')
				if (page) currentParams.page = parseInt(page, 10)

				const pageSize = prev.get('pageSize')
				if (pageSize) currentParams.pageSize = parseInt(pageSize, 10)

				const search = prev.get('search')
				if (search) currentParams.search = search

				const sortBy = prev.get('sortBy')
				if (sortBy) currentParams.sortBy = sortBy

				const sortOrder = prev.get('sortOrder')
				if (sortOrder) currentParams.sortOrder = sortOrder

				const dateFrom = prev.get('dateFrom')
				if (dateFrom) currentParams.dateFrom = dateFrom

				const dateTo = prev.get('dateTo')
				if (dateTo) currentParams.dateTo = dateTo

				const isActive = prev.get('isActive')
				if (isActive !== null) currentParams.isActive = isActive === 'true'

				// Вычисляем обновления (поддержка functional update)
				const resolvedUpdates =
					typeof updates === 'function' ? updates(currentParams as T) : updates

				const newParams = new URLSearchParams()

				// Объединяем текущие параметры с обновлениями
				const mergedParams = { ...currentParams, ...resolvedUpdates }

				// Применяем все параметры в URL (не удаляем дефолтные значения)
				Object.entries(mergedParams).forEach(([key, value]) => {
					if (value !== undefined && value !== null && value !== '') {
						newParams.set(key, String(value))
					}
				})

				return newParams
			})
		},
		[setSearchParams, stableDefaults],
	)

	/**
	 * Сброс всех параметров к значениям по умолчанию
	 */
	const resetParams = useCallback(() => {
		setSearchParams({})
	}, [setSearchParams])

	return { params, setParams, resetParams }
}
