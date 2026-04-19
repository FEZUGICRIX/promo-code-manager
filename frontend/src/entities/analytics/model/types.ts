// ─── Base Types ───────────────────────────────────────────────────────────────

/**
 * Enum для направления сортировки
 */
export enum SortOrder {
	ASC = 'ASC',
	DESC = 'DESC',
}

/**
 * Базовые параметры для аналитических запросов
 */
export interface BaseAnalyticsParams {
	page: number
	pageSize: number
	search?: string
	sortOrder: SortOrder
	dateFrom?: string // ISO date string (yyyy-MM-dd)
	dateTo?: string // ISO date string (yyyy-MM-dd)
}

/**
 * Generic интерфейс для пагинированного ответа от API
 */
export interface PaginatedResponse<T> {
	data: T[]
	total: number
	page: number
	pageSize: number
}

// ─── Users Analytics ──────────────────────────────────────────────────────────

/**
 * Допустимые колонки для сортировки в Users Analytics
 */
export const USERS_SORT_COLUMNS = [
	'id',
	'name',
	'email',
	'phone',
	'isActive',
	'createdAt',
	'totalOrders',
	'totalSpent',
	'totalDiscount',
	'promoUsagesCount',
] as const

/**
 * Тип для колонок сортировки Users Analytics
 */
export type UsersSortColumn = (typeof USERS_SORT_COLUMNS)[number]

/**
 * Параметры запроса для Users Analytics
 */
export interface UsersAnalyticsParams extends BaseAnalyticsParams {
	sortBy: UsersSortColumn
	isActive?: boolean
}

/**
 * Интерфейс пользователя в аналитике
 */
export interface AnalyticsUser {
	id: string
	name: string
	email: string
	phone: string
	isActive: boolean
	createdAt: string
	totalOrders: number
	totalSpent: number
	totalDiscount: number
	promoUsagesCount: number
}

// ─── Promocodes Analytics ─────────────────────────────────────────────────────

/**
 * Допустимые колонки для сортировки в Promocodes Analytics
 */
export const PROMOCODES_SORT_COLUMNS = [
	'id',
	'code',
	'discount',
	'totalLimit',
	'userLimit',
	'isActive',
	'createdAt',
	'usageCount',
	'totalRevenue',
	'uniqueUsers',
	'totalDiscount',
] as const

/**
 * Тип для колонок сортировки Promocodes Analytics
 */
export type PromocodesSortColumn = (typeof PROMOCODES_SORT_COLUMNS)[number]

/**
 * Параметры запроса для Promocodes Analytics
 */
export interface PromocodesAnalyticsParams extends BaseAnalyticsParams {
	sortBy: PromocodesSortColumn
	isActive?: boolean
}

/**
 * Интерфейс промокода в аналитике
 */
export interface AnalyticsPromocode {
	id: string
	code: string
	discountType: string
	discount: number
	totalLimit: number
	userLimit: number
	isActive: boolean
	createdAt: string
	dateTo?: string
	dateFrom?: string
	usageCount: number
	totalRevenue: number
	uniqueUsers: number
	totalDiscount: number
}

// ─── Promo Usages Analytics ───────────────────────────────────────────────────

/**
 * Допустимые колонки для сортировки в Promo Usages Analytics
 */
export const PROMO_USAGES_SORT_COLUMNS = [
	'id',
	'promocodeCode',
	'promocodeDiscount',
	'userName',
	'userEmail',
	'orderId',
	'orderAmount',
	'discountAmount',
	'createdAt',
] as const

/**
 * Тип для колонок сортировки Promo Usages Analytics
 */
export type PromoUsagesSortColumn = (typeof PROMO_USAGES_SORT_COLUMNS)[number]

/**
 * Параметры запроса для Promo Usages Analytics
 */
export interface PromoUsagesAnalyticsParams extends BaseAnalyticsParams {
	sortBy: PromoUsagesSortColumn
}

/**
 * Интерфейс использования промокода в аналитике
 */
export interface AnalyticsPromoUsage {
	id: string
	promocodeCode: string
	promocodeDiscount: number
	promocodeDiscountType: string
	userName: string
	userEmail: string
	orderId: string
	orderAmount: number
	discountAmount: number
	createdAt: string
}

// ─── Orders Analytics ─────────────────────────────────────────────────────────

/**
 * Допустимые колонки для сортировки в Orders Analytics
 */
export const ORDERS_SORT_COLUMNS = ['id', 'amount', 'discount', 'finalAmount', 'createdAt'] as const

/**
 * Тип для колонок сортировки Orders Analytics
 */
export type OrdersSortColumn = (typeof ORDERS_SORT_COLUMNS)[number]

/**
 * Параметры запроса для Orders Analytics
 */
export interface OrdersAnalyticsParams extends BaseAnalyticsParams {
	sortBy: OrdersSortColumn
}

/**
 * Интерфейс заказа в аналитике
 */
export interface AnalyticsOrder {
	id: string
	userId: string
	userName: string
	userEmail: string
	amount: number
	discount: number
	finalAmount: number
	promocodeId?: string | null
	promocodeCode?: string | null
	createdAt: string
}

// ─── Summary Response ─────────────────────────────────────────────────────────

/**
 * Интерфейс ответа с агрегированными метриками пользователей
 */
export interface UsersSummaryResponse {
	totalUsers: number
	activeUsers: number
	averageCheck: number
}
