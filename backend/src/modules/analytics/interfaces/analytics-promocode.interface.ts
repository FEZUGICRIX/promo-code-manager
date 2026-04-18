export interface AnalyticsPromocode {
	id: string
	code: string
	discount: number
	totalLimit: number
	userLimit: number
	isActive: number // UInt8: 0 | 1
	createdAt: string
	usageCount: number
	totalRevenue: number
	uniqueUsers: number
	totalDiscount: number
}
