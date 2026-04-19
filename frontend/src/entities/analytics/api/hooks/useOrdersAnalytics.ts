import { useQuery } from '@tanstack/react-query'
import { analyticsApi } from '../analyticsApi'
import type { OrdersAnalyticsParams, PaginatedResponse, AnalyticsOrder } from '../../model/types'

/**
 * Хук для получения списка заказов с аналитическими данными
 *
 * @param params - Параметры запроса (page, pageSize, sortBy, sortOrder, search, dateFrom, dateTo)
 * @returns Объект с data, isLoading, isError, error, refetch из TanStack Query
 *
 * @example
 * ```tsx
 * const { data, isLoading, isError } = useOrdersAnalytics({
 *   page: 1,
 *   pageSize: 10,
 *   sortBy: 'createdAt',
 *   sortOrder: SortOrder.DESC,
 * })
 * ```
 */
export function useOrdersAnalytics(params: OrdersAnalyticsParams) {
	return useQuery<PaginatedResponse<AnalyticsOrder>>({
		queryKey: ['analytics', 'orders', params],
		queryFn: () => analyticsApi.getOrders(params),
		staleTime: 3_000,
	})
}
