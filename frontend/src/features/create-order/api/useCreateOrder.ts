import { useMutation, useQueryClient } from '@tanstack/react-query'
import type { AxiosError } from 'axios'
import { toast } from 'sonner'
import { ordersApi } from './ordersApi'

/**
 * Mutation hook for creating an order
 * Requirements: 1.3, 1.6, 1.7
 */
export function useCreateOrder() {
	const queryClient = useQueryClient()

	return useMutation({
		mutationFn: (data: { amount: number }) => ordersApi.create(data),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['analytics', 'orders'] })
			toast.success('Заказ успешно создан')
		},
		onError: (error: AxiosError<{ message: string }>) => {
			toast.error(error.response?.data?.message ?? 'Не удалось создать заказ')
		},
	})
}
