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

export interface AnalyticsPromocode {
	id: string
	code: string
	discount: number
	totalLimit: number
	userLimit: number
	dateFrom?: string
	dateTo?: string
	isActive: boolean
	createdAt: string
	timesUsed: number
	totalRevenue: number
	uniqueUsers: number
}

export interface CreatePromocodeDto {
	code: string
	discount: number
	totalLimit: number
	userLimit: number
	dateFrom?: string
	dateTo?: string
}

export interface UpdatePromocodeDto {
	code?: string
	discount?: number
	totalLimit?: number
	userLimit?: number
	dateFrom?: string
	dateTo?: string
	isActive?: boolean
}
