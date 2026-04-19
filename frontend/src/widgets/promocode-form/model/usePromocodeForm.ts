import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import type { AnalyticsPromocode } from '@/entities/analytics/model/types'
import type { PromocodeFormData } from '@/entities/promocode/model/types'
import { promocodeValidationSchema } from './validation'

/**
 * Hook for managing Promocode Form state with validation
 *
 * Configures react-hook-form with:
 * - Zod validation schema via zodResolver
 * - onBlur validation mode
 * - Create mode (empty form) or Edit mode (pre-filled with promocode data)
 *
 * @param promocode - Optional promocode to edit (null/undefined for create mode)
 * @returns react-hook-form instance configured for promocode form
 *
 * @example
 * ```tsx
 * const form = usePromocodeForm(promocode)
 * const { register, handleSubmit, formState: { errors, isValid } } = form
 * ```
 *
 * Requirements: 1.2, 2.1, 2.2, 3.2
 */
export function usePromocodeForm(promocode?: AnalyticsPromocode | null) {
	const isEditMode = Boolean(promocode)

	const today = new Date().toISOString().split('T')[0]

	const form = useForm<PromocodeFormData>({
		resolver: zodResolver(promocodeValidationSchema),
		mode: 'onBlur',
		defaultValues:
			isEditMode && promocode
				? {
						code: promocode.code,
						discount: promocode.discount,
						totalLimit: promocode.totalLimit,
						userLimit: promocode.userLimit,
						dateTo: promocode.dateTo || '',
						dateFrom: promocode.dateFrom || today,
					}
				: {
						code: '',
						discount: 0,
						totalLimit: 0,
						userLimit: 0,
						dateTo: '',
						dateFrom: today,
					},
	})

	return form
}
