import { useMutation, useQueryClient } from '@tanstack/react-query'
import { isAxiosError } from 'axios'
import { toast } from 'sonner'
import { promocodeApi } from '@/entities/promocode/api/promocodeApi'
import { promocodeKeys } from '@/entities/promocode/api/query-keys'
import type { CreatePromocodeDTO } from '@/entities/promocode/model/types'
import type { AnalyticsPromocode, PaginatedResponse } from '@/entities/analytics/model/types'

/**
 * Хук для создания нового промокода с Optimistic Update
 *
 * Requirements: 1.10, 1.11, 1.13, 1.14, 6.1, 6.2, 6.3, 6.4, 17.3
 */
export function useCreatePromocode() {
	const queryClient = useQueryClient()

	return useMutation({
		mutationFn: (data: CreatePromocodeDTO) => promocodeApi.create(data),

		// Optimistic Update: немедленно добавляем промокод в таблицу
		onMutate: async (newPromocode) => {
			// Отменяем все активные запросы к analytics/promocodes
			await queryClient.cancelQueries({ queryKey: promocodeKeys.analytics() })

			// Сохраняем снимок ВСЕХ кэшированных запросов по префиксу
			const previousQueries = queryClient.getQueriesData<PaginatedResponse<AnalyticsPromocode>>({
				queryKey: promocodeKeys.analytics(),
			})

			// Обновляем все закэшированные страницы оптимистично
			queryClient.setQueriesData(
				{ queryKey: promocodeKeys.analytics() },
				(old: PaginatedResponse<AnalyticsPromocode> | undefined) => {
					if (!old) return old

					const optimisticPromocode: AnalyticsPromocode = {
						id: `temp-${Date.now()}`,
						code: newPromocode.code,
						discount: newPromocode.discount,
						totalLimit: newPromocode.totalLimit,
						userLimit: newPromocode.userLimit,
						isActive: true,
						createdAt: new Date().toISOString(),
						dateTo: newPromocode.dateTo,
						dateFrom: newPromocode.dateFrom,
						usageCount: 0,
						totalRevenue: 0,
						uniqueUsers: 0,
						totalDiscount: 0,
					}

					return {
						...old,
						data: [optimisticPromocode, ...old.data],
						total: old.total + 1,
					}
				},
			)

			return { previousQueries }
		},

		// Откат при ошибке — восстанавливаем все снимки (Requirement 6.4)
		onError: (error, _newPromocode, context) => {
			if (context?.previousQueries) {
				for (const [queryKey, data] of context.previousQueries) {
					queryClient.setQueryData(queryKey, data)
				}
			}

			// Определяем сообщение об ошибке
			let description = 'Попробуйте снова'
			if (isAxiosError(error)) {
				if (error.response?.status === 409) {
					description = 'Промокод с таким кодом уже существует'
				} else if (error.response?.data?.message) {
					description = error.response.data.message
				}
			}

			toast.error('Не удалось создать промокод', { description })
		},

		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: promocodeKeys.analytics() })
			toast.success('Промокод успешно создан')
		},
	})
}
