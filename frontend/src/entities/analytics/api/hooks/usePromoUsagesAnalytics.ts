import { useQuery } from '@tanstack/react-query'
import { analyticsApi } from '../analyticsApi'
import type {
	PromoUsagesAnalyticsParams,
	PaginatedResponse,
	AnalyticsPromoUsage,
} from '../../model/types'

/**
 * Хук для получения истории использований промокодов
 *
 * @param params - Параметры запроса (page, pageSize, sortBy, sortOrder, search, dateFrom, dateTo)
 * @returns Объект с data, isLoading, isError, error, refetch из TanStack Query
 *
 * @example
 * ```tsx
 * const { data, isLoading, isError } = usePromoUsagesAnalytics({
 *   page: 1,
 *   pageSize: 10,
 *   sortBy: 'createdAt',
 *   sortOrder: SortOrder.DESC,
 * })
 * ```
 */
export function usePromoUsagesAnalytics(params: PromoUsagesAnalyticsParams) {
	return useQuery<PaginatedResponse<AnalyticsPromoUsage>>({
		queryKey: ['analytics', 'promo-usages', params],
		queryFn: () => analyticsApi.getPromoUsages(params),
		staleTime: 3_000,
	})
}
