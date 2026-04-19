import { useQuery } from '@tanstack/react-query'
import { analyticsApi } from '../analyticsApi'
import type { UsersSummaryResponse } from '../../model/types'

/**
 * Хук для получения агрегированных метрик пользователей
 *
 * @returns Объект с data, isLoading, isError, error, refetch из TanStack Query
 *
 * @example
 * ```tsx
 * const { data, isLoading, isError } = useUsersSummary()
 * ```
 */
export function useUsersSummary() {
	return useQuery<UsersSummaryResponse>({
		queryKey: ['analytics', 'users', 'summary'],
		queryFn: () => analyticsApi.getUsersSummary(),
		staleTime: 60000,
	})
}
