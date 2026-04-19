import { useQuery, UseQueryOptions } from '@tanstack/react-query'
import { api } from '@/shared/api/instance'
import { cleanParams } from '@/shared/lib'
import { createAnalyticsQueryKey } from '../query-keys'
import type { BaseAnalyticsParams, PaginatedResponse } from '../../model/types'

/**
 * Generic хук для запросов аналитических данных с использованием TanStack Query
 *
 * @template TData - Тип данных в ответе (например, AnalyticsUser)
 * @template TParams - Тип параметров запроса (расширяет BaseAnalyticsParams)
 *
 * @param endpoint - API endpoint (например, '/analytics/users')
 * @param params - Параметры запроса (page, pageSize, search, sortBy, sortOrder, dateFrom, dateTo)
 * @param options - Дополнительные опции для TanStack Query
 *
 * @returns Объект с data, isLoading, isError, error, refetch из TanStack Query
 *
 * @example
 * ```tsx
 * const { data, isLoading, isError, error, refetch } = useAnalyticsQuery<
 *   AnalyticsUser,
 *   UsersAnalyticsParams
 * >('/analytics/users', {
 *   page: 1,
 *   pageSize: 10,
 *   sortBy: 'createdAt',
 *   sortOrder: SortOrder.DESC,
 *   search: 'john',
 *   isActive: true
 * })
 * ```
 */
export function useAnalyticsQuery<TData, TParams extends BaseAnalyticsParams>(
	endpoint: string,
	params: TParams,
	options?: Omit<UseQueryOptions<PaginatedResponse<TData>>, 'queryKey' | 'queryFn'>,
) {
	return useQuery({
		queryKey: createAnalyticsQueryKey(endpoint, params),
		queryFn: async () => {
			const { data } = await api.get<PaginatedResponse<TData>>(endpoint, {
				params: cleanParams(params),
			})
			return data
		},
		...options,
	})
}
