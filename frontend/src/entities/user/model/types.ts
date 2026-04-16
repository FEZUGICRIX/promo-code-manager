export interface User {
	_id: string
	email: string
	name: string
	phone: string
	isActive: boolean
	createdAt: string
	updatedAt: string
}

export interface AnalyticsUser {
	id: string
	email: string
	name: string
	phone: string
	isActive: boolean
	createdAt: string
	totalOrders: number
	totalSpent: number
	totalDiscount: number
	promocodesUsed: number
}
