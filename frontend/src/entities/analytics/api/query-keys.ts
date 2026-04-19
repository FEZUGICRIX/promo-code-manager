/**
 * Создает query key для TanStack Query на основе endpoint и параметров
 *
 * @param endpoint - API endpoint (например, '/analytics/users')
 * @param params - Параметры запроса
 * @returns Массив для использования в качестве query key
 *
 * @example
 * ```ts
 * const queryKey = createAnalyticsQueryKey('/analytics/users', { page: 1, pageSize: 10 })
 * // ['analytics', '/analytics/users', { page: 1, pageSize: 10 }]
 * ```
 */
export function createAnalyticsQueryKey<T extends object>(
	endpoint: string,
	params: T,
): [string, string, T] {
	return ['analytics', endpoint, params]
}
