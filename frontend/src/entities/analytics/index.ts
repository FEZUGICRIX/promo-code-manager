// ─── Types ────────────────────────────────────────────────────────────────────
export {
	SortOrder,
	USERS_SORT_COLUMNS,
	PROMOCODES_SORT_COLUMNS,
	PROMO_USAGES_SORT_COLUMNS,
	ORDERS_SORT_COLUMNS,
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
	UsersSummaryResponse,
	OrdersSortColumn,
	OrdersAnalyticsParams,
	AnalyticsOrder,
} from './model/types'

// ─── Hooks ────────────────────────────────────────────────────────────────────
export { useAnalyticsQuery } from './api/hooks/useAnalyticsQuery'
export { useUsersSummary } from './api/hooks/useUsersSummary'
export { useUsersAnalytics } from './api/hooks/useUsersAnalytics'
export { usePromocodesAnalytics } from './api/hooks/usePromocodesAnalytics'
export { useOrdersAnalytics } from './api/hooks/useOrdersAnalytics'
export { usePromoUsagesAnalytics } from './api/hooks/usePromoUsagesAnalytics'

// ─── UI ───────────────────────────────────────────────────────────────────────
export { UserStatusBadge } from './ui/UserStatusBadge'
export { PromocodeStatusBadge } from './ui/PromocodeStatusBadge'

// ─── Column Definitions ───────────────────────────────────────────────────────
export { usersTableColumns } from './model/columns'
export { promocodeColumns } from './model/promocode-columns'
export { orderColumns } from './model/order-columns'
export { promoUsageColumns } from './model/promo-usage-columns'

// ─── API Utilities (internal use only — not re-exported) ──────────────────────
export { createAnalyticsQueryKey } from './api/query-keys'
