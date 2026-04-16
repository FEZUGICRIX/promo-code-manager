export interface Order {
	_id: string
	userId: string
	amount: number
	discount: number
	finalAmount: number
	promocodeId?: string
	createdAt: string
	updatedAt: string
}

export interface AnalyticsPromoUsage {
	id: string
	promocodeCode: string
	promocodeDiscount: number
	userName: string
	userEmail: string
	orderId: string
	orderAmount: number
	discountAmount: number
	createdAt: string
}

export interface CreateOrderDto {
	amount: number
}

export interface ApplyPromocodeDto {
	code: string
}
