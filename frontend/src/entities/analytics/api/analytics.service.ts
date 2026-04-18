/**
 * Удаляет undefined и пустые значения из объекта параметров
 *
 * @param params - Объект с параметрами запроса
 * @returns Очищенный объект параметров
 *
 * @example
 * ```ts
 * cleanParams({ page: 1, search: '', name: undefined, email: 'test@example.com' })
 * // { page: 1, email: 'test@example.com' }
 * ```
 */
export function cleanParams<T extends Record<string, any>>(params: T): Partial<T> {
	return Object.fromEntries(
		Object.entries(params).filter(([_, value]) => value !== undefined && value !== ''),
	) as Partial<T>
}
