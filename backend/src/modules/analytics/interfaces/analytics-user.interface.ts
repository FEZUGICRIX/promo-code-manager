export interface AnalyticsUser {
	id: string
	name: string
	email: string
	phone: string
	isActive: number // UInt8: 0 | 1
	createdAt: string
	totalOrders: number
	totalSpent: number
	totalDiscount: number
	promoUsagesCount: number
}
