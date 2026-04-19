export interface AnalyticsPromocode {
	id: string
	code: string
	discount: number
	totalLimit: number
	userLimit: number
	dateFrom: string | null
	dateTo: string | null
	isActive: number // UInt8: 0 | 1
	createdAt: string
	usageCount: number
	totalRevenue: number
	uniqueUsers: number
	totalDiscount: number
}
