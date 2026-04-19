import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { promocodeApi } from '@/entities/promocode/api/promocodeApi'
import { promocodeKeys } from '@/entities/promocode/api/query-keys'

/**
 * Хук для деактивации промокода
 *
 * Реализует TanStack Query mutation для PATCH /promocodes/:id/deactivate с:
 * - Cache invalidation: обновление кэша после успешной деактивации
 * - Error handling: toast уведомления при ошибке
 *
 * @returns TanStack Query mutation object
 *
 * @example
 * ```tsx
 * const deactivateMutation = useDeactivatePromocode()
 *
 * const handleDeactivate = async (id: string) => {
 *   try {
 *     await deactivateMutation.mutateAsync(id)
 *   } catch (error) {
 *     // Ошибка обработана в mutation
 *   }
 * }
 * ```
 *
 * Requirements: 2.1.3, 2.1.4, 2.1.6, 2.1.7
 */
export function useDeactivatePromocode() {
	const queryClient = useQueryClient()

	return useMutation({
		mutationFn: (id: string) => promocodeApi.deactivate(id),

		// Обработка ошибки (Requirement 2.1.7)
		onError: (error) => {
			// Показываем toast уведомление об ошибке
			toast.error('Не удалось деактивировать промокод', {
				description: error instanceof Error ? error.message : 'Попробуйте снова',
			})
		},

		onSuccess: () => {
			queryClient.refetchQueries({ queryKey: promocodeKeys.analytics() })
			toast.success('Промокод успешно деактивирован')
		},
	})
}
