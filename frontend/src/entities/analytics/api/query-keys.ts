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
// TODO: убрать any!!!
export function createAnalyticsQueryKey(endpoint: string, params: any): [string, string, any] {
	return ['analytics', endpoint, params]
}
