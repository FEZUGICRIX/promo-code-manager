import { api } from '@/shared/api/instance'

/**
 * API methods for orders
 * Requirements: 1.3, 2.3
 */
export const ordersApi = {
	/**
	 * Create a new order
	 * POST /orders
	 */
	async create(data: { amount: number }) {
		const { data: response } = await api.post<{
			_id: string
			userId: string
			amount: number
			discount: number
			finalAmount: number
			createdAt: string
			updatedAt: string
		}>('/orders', data)
		return response
	},

	/**
	 * Apply a promocode to an existing order
	 * POST /orders/:id/apply-promocode
	 */
	async applyPromocode(orderId: string, data: { promocodeCode: string }) {
		const { data: response } = await api.post(`/orders/${orderId}/apply-promocode`, data)
		return response
	},
}
