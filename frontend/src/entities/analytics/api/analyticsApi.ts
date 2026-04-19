import { api } from '@/shared/api/instance'
import { cleanParams } from '@/shared/lib'
import type {
	PaginatedResponse,
	AnalyticsUser,
	UsersAnalyticsParams,
	UsersSummaryResponse,
	AnalyticsPromocode,
	PromocodesAnalyticsParams,
} from '../model/types'

/**
 * API-методы для аналитики
 */
export const analyticsApi = {
	/**
	 * Получить агрегированные метрики пользователей
	 * GET /analytics/users/summary
	 */
	async getUsersSummary(): Promise<UsersSummaryResponse> {
		const { data } = await api.get<UsersSummaryResponse>('/analytics/users/summary')
		return data
	},

	/**
	 * Получить список пользователей с аналитическими данными
	 * GET /analytics/users
	 */
	async getUsers(params: UsersAnalyticsParams): Promise<PaginatedResponse<AnalyticsUser>> {
		const { data } = await api.get<PaginatedResponse<AnalyticsUser>>('/analytics/users', {
			params: cleanParams(params),
		})
		return data
	},

	/**
	 * Получить список промокодов с аналитическими данными
	 * GET /analytics/promocodes
	 */
	async getPromocodes(
		params: PromocodesAnalyticsParams,
	): Promise<PaginatedResponse<AnalyticsPromocode>> {
		const { data } = await api.get<PaginatedResponse<AnalyticsPromocode>>('/analytics/promocodes', {
			params: cleanParams(params),
		})
		return data
	},
}
