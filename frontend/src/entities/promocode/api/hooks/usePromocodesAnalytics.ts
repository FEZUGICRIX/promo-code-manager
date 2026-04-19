/**
 * Хук для получения аналитических данных промокодов из ClickHouse
 *
 * Используется для отображения таблицы с метриками эффективности промокодов
 */

import { useQuery } from '@tanstack/react-query'
import { analyticsApi } from '@/entities/analytics/api/analyticsApi'
import type {
	PromocodesAnalyticsParams,
	PaginatedResponse,
	AnalyticsPromocode,
} from '@/entities/analytics/model/types'
import { promocodeKeys } from '../query-keys'

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
 *
 * if (isLoading) return <Spinner />
 * if (isError) return <ErrorState />
 *
 * return <PromocodesTable data={data.data} total={data.total} />
 * ```
 */
export function usePromocodesAnalytics(params: PromocodesAnalyticsParams) {
	return useQuery<PaginatedResponse<AnalyticsPromocode>>({
		queryKey: promocodeKeys.analyticsWithParams(params),
		queryFn: () => analyticsApi.getPromocodes(params),
		staleTime: 60000, // 60 seconds
	})
}
