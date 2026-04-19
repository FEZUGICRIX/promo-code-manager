import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { promocodeApi } from '@/entities/promocode/api/promocodeApi'
import { promocodeKeys } from '@/entities/promocode/api/query-keys'
import type { UpdatePromocodeDTO } from '@/entities/promocode/model/types'

/**
 * Хук для обновления промокода
 *
 * Реализует TanStack Query mutation для PATCH /promocodes/:id с:
 * - Cache invalidation: обновление кэша после успешного обновления
 * - Error handling: toast уведомления при ошибке
 *
 * @returns TanStack Query mutation object
 *
 * @example
 * ```tsx
 * const updateMutation = useUpdatePromocode()
 *
 * const handleSubmit = async (id: string, data: UpdatePromocodeDTO) => {
 *   try {
 *     await updateMutation.mutateAsync({ id, data })
 *   } catch (error) {
 *     // Ошибка обработана в mutation
 *   }
 * }
 * ```
 *
 * Requirements: 2.4, 2.5, 2.6, 2.7, 2.8
 */
export function useUpdatePromocode() {
	const queryClient = useQueryClient()

	return useMutation({
		mutationFn: ({ id, data }: { id: string; data: UpdatePromocodeDTO }) =>
			promocodeApi.update(id, data),

		// Обработка ошибки (Requirement 2.8)
		onError: (error) => {
			// Показываем toast уведомление об ошибке
			toast.error('Не удалось обновить промокод', {
				description: error instanceof Error ? error.message : 'Попробуйте снова',
			})
		},

		// Обновление кэша после успешного обновления (Requirement 2.7)
		onSuccess: () => {
			// Инвалидируем кэш для получения актуальных данных от сервера
			queryClient.invalidateQueries({ queryKey: promocodeKeys.analytics() })

			// Показываем toast уведомление об успехе
			toast.success('Промокод успешно обновлён')
		},
	})
}
