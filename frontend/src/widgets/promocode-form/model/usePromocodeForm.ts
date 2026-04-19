import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import type { AnalyticsPromocode } from '@/entities/analytics/model/types'
import type { PromocodeFormData } from '@/entities/promocode/model/types'
import { DiscountType } from '@/entities/promocode/model/types'
import { promocodeValidationSchema } from './validation'

export function usePromocodeForm(promocode?: AnalyticsPromocode | null) {
	const isEditMode = Boolean(promocode)
	const today = new Date().toISOString().split('T')[0]

	const form = useForm<PromocodeFormData>({
		resolver: zodResolver(promocodeValidationSchema),
		mode: 'onChange',
		defaultValues:
			isEditMode && promocode
				? {
						code: promocode.code,
						discountType: (promocode.discountType as DiscountType) ?? DiscountType.PERCENTAGE,
						discount: promocode.discount,
						totalLimit: promocode.totalLimit,
						userLimit: promocode.userLimit,
						dateTo: promocode.dateTo || '',
						dateFrom: promocode.dateFrom || today,
					}
				: {
						code: '',
						discountType: DiscountType.PERCENTAGE,
						discount: 0,
						totalLimit: 0,
						userLimit: 0,
						dateTo: '',
						dateFrom: today,
					},
	})

	return form
}
