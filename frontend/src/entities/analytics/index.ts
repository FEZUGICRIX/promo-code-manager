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
	UsersSummaryResponse,
} from './model/types'

// ─── Hooks ────────────────────────────────────────────────────────────────────
export { useAnalyticsQuery } from './api/hooks/useAnalyticsQuery'
export { useUsersSummary } from './api/hooks/useUsersSummary'
export { useUsersAnalytics } from './api/hooks/useUsersAnalytics'

// ─── UI ───────────────────────────────────────────────────────────────────────
export { UserStatusBadge } from './ui/UserStatusBadge'

// ─── Column Definitions ───────────────────────────────────────────────────────
export { usersTableColumns } from './model/columns'

// ─── API Utilities (internal use only — not re-exported) ──────────────────────
export { createAnalyticsQueryKey } from './api/query-keys'
