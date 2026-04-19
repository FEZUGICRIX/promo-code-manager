/**
 * Query keys для TanStack Query в promocode entity
 *
 * Используется для управления кэшированием и инвалидацией данных промокодов
 */

import type { PromocodesAnalyticsParams } from '@/entities/analytics/model/types'

/**
 * Базовый ключ для всех запросов промокодов
 */
export const promocodeKeys = {
	/**
	 * Корневой ключ для всех запросов промокодов
	 */
	all: ['promocodes'] as const,

	/**
	 * Ключ для списка промокодов (CRUD операции)
	 */
	lists: () => [...promocodeKeys.all, 'list'] as const,

	/**
	 * Ключ для конкретного списка промокодов с фильтрами
	 */
	list: (filters: Record<string, unknown>) => [...promocodeKeys.lists(), filters] as const,

	/**
	 * Ключ для деталей конкретного промокода
	 */
	details: () => [...promocodeKeys.all, 'detail'] as const,

	/**
	 * Ключ для конкретного промокода по ID
	 */
	detail: (id: string) => [...promocodeKeys.details(), id] as const,

	/**
	 * Ключ для аналитических данных промокодов
	 */
	analytics: () => ['analytics', 'promocodes'] as const,

	/**
	 * Ключ для аналитических данных с параметрами
	 */
	analyticsWithParams: (params: PromocodesAnalyticsParams) =>
		[...promocodeKeys.analytics(), params] as const,
}
