// ─── Types ────────────────────────────────────────────────────────────────────
export type {
	Promocode,
	PromocodeFormData,
	CreatePromocodeDTO,
	UpdatePromocodeDTO,
} from './model/types'

// ─── API ──────────────────────────────────────────────────────────────────────
export { promocodeApi } from './api/promocodeApi'
export { promocodeKeys } from './api/query-keys'

// ─── Hooks ────────────────────────────────────────────────────────────────────
export { usePromocodesAnalytics } from './api/hooks/usePromocodesAnalytics'
