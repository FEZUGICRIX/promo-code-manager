import { useMutation, useQueryClient } from '@tanstack/react-query'
import type { AxiosError } from 'axios'
import { toast } from 'sonner'
import { ordersApi } from './ordersApi'

/**
 * Mutation hook for applying a promocode to an order
 * Requirements: 2.3, 2.13, 2.20
 */
export function useApplyPromocode() {
	const queryClient = useQueryClient()

	return useMutation({
		mutationFn: ({ orderId, promocodeCode }: { orderId: string; promocodeCode: string }) =>
			ordersApi.applyPromocode(orderId, { promocodeCode }),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['analytics', 'orders'] })
			toast.success('Промокод успешно применён')
		},
		onError: (error: AxiosError<{ message: string }>) => {
			toast.error(error.response?.data?.message ?? 'Не удалось применить промокод')
		},
	})
}
