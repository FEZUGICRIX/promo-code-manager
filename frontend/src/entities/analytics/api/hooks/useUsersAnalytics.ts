import { useQuery } from '@tanstack/react-query'
import { analyticsApi } from '../analyticsApi'
import type { UsersAnalyticsParams, PaginatedResponse, AnalyticsUser } from '../../model/types'

/**
 * Хук для получения списка пользователей с аналитическими данными
 *
 * @param params - Параметры запроса (page, pageSize, sortBy, sortOrder, search, isActive, dateFrom, dateTo)
 * @returns Объект с data, isLoading, isError, error, refetch из TanStack Query
 *
 * @example
 * ```tsx
 * const { data, isLoading, isError } = useUsersAnalytics({
 *   page: 1,
 *   pageSize: 10,
 *   sortBy: 'createdAt',
 *   sortOrder: SortOrder.DESC,
 * })
 * ```
 */
export function useUsersAnalytics(params: UsersAnalyticsParams) {
	return useQuery<PaginatedResponse<AnalyticsUser>>({
		queryKey: ['analytics', 'users', params],
		queryFn: () => analyticsApi.getUsers(params),
		staleTime: 60000,
	})
}
