// ─── Promocode Entity Types ──────────────────────────────────────────────────

/**
 * Promocode entity from MongoDB
 */
export interface Promocode {
	_id: string
	code: string
	discount: number
	totalLimit: number
	userLimit: number
	dateFrom?: string
	dateTo?: string
	isActive: boolean
	createdAt: string
	updatedAt: string
}

/**
 * Promocode Form Data (for create/edit forms)
 */
export interface PromocodeFormData {
	code: string
	discount: number
	totalLimit: number
	userLimit: number
	dateTo?: string
	dateFrom: string
}

/**
 * Promocode Create DTO (sent to backend)
 */
export interface CreatePromocodeDTO {
	code: string
	discount: number
	totalLimit: number
	userLimit: number
	dateTo?: string
	dateFrom?: string
}

/**
 * Promocode Update DTO (sent to backend)
 */
export interface UpdatePromocodeDTO {
	discount?: number
	totalLimit?: number
	userLimit?: number
	dateTo?: string
	dateFrom?: string
}
