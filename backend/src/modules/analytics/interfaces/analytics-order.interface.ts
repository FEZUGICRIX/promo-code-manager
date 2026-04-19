export interface AnalyticsOrder {
	id: string
	userId: string
	userName: string
	userEmail: string
	amount: number
	discount: number
	finalAmount: number
	promocodeId: string | null
	promocodeCode: string | null
	createdAt: string
}
