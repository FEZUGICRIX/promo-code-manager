// ─── Types ────────────────────────────────────────────────────────────────────
export {
	SortOrder,
	USERS_SORT_COLUMNS,
	PROMOCODES_SORT_COLUMNS,
	PROMO_USAGES_SORT_COLUMNS,
} from './model/types'

export type {
	BaseAnalyticsParams,
	PaginatedResponse,
	UsersSortColumn,
	UsersAnalyticsParams,
	AnalyticsUser,
	PromocodesSortColumn,
	PromocodesAnalyticsParams,
	AnalyticsPromocode,
	PromoUsagesSortColumn,
	PromoUsagesAnalyticsParams,
	AnalyticsPromoUsage,
} from './model/types'

// ─── Hooks ────────────────────────────────────────────────────────────────────
export { useAnalyticsQuery } from './lib/useAnalyticsQuery'

// ─── API Utilities ────────────────────────────────────────────────────────────
export { createAnalyticsQueryKey } from './api/query-keys'
export { cleanParams } from './api/analytics.service'
