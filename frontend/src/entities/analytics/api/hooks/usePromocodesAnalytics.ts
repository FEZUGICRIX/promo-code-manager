import { useQuery } from '@tanstack/react-query'
import { analyticsApi } from '../analyticsApi'
import type {
	PromocodesAnalyticsParams,
	PaginatedResponse,
	AnalyticsPromocode,
} from '../../model/types'

/**
 * Хук для получения списка промокодов с аналитическими данными
 *
 * @param params - Параметры запроса (page, pageSize, sortBy, sortOrder, search, isActive, dateFrom, dateTo)
 * @returns Объект с data, isLoading, isError, error, refetch из TanStack Query
 *
 * @example
 * ```tsx
 * const { data, isLoading, isError } = usePromocodesAnalytics({
 *   page: 1,
 *   pageSize: 10,
 *   sortBy: 'createdAt',
 *   sortOrder: SortOrder.DESC,
 * })
 * ```
 */
export function usePromocodesAnalytics(params: PromocodesAnalyticsParams) {
	return useQuery<PaginatedResponse<AnalyticsPromocode>>({
		queryKey: ['analytics', 'promocodes', params],
		queryFn: () => analyticsApi.getPromocodes(params),
		staleTime: 30_000,
	})
}
