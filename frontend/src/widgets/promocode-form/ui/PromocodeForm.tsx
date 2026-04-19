import { usePromocodeForm } from '../model/usePromocodeForm'
import { useCreatePromocode } from '@/features/create-promocode/api/useCreatePromocode'
import { useUpdatePromocode } from '@/features/update-promocode/api/useUpdatePromocode'
import { PromocodeFormFields } from './PromocodeFormFields'
import type { AnalyticsPromocode } from '@/entities/analytics/model/types'
import type { PromocodeFormData } from '@/entities/promocode/model/types'

/**
 * Props for PromocodeForm component
 */
interface PromocodeFormProps {
	/**
	 * Promocode to edit (null/undefined for create mode)
	 */
	promocode?: AnalyticsPromocode | null

	/**
	 * Callback when form is successfully submitted
	 */
	onSuccess: () => void

	/**
	 * Callback when form is cancelled
	 */
	onCancel: () => void
}

/**
 * Promocode Form Component
 *
 * Integrates:
 * - usePromocodeForm hook for form state management
 * - useCreatePromocode mutation for creating promocodes
 * - useUpdatePromocode mutation for updating promocodes
 * - PromocodeFormFields for rendering form fields
 *
 * Features:
 * - Create and Edit modes
 * - Form validation with error display
 * - Submit button disabled when form is invalid or mutation is pending
 * - API error handling via toast notifications (handled in mutations)
 *
 * Requirements: 1.10, 1.14, 1.15, 2.4, 2.7, 2.8, 3.5, 3.6
 */
export function PromocodeForm({ promocode, onSuccess, onCancel }: PromocodeFormProps) {
	const isEditMode = Boolean(promocode)

	// Initialize form with validation
	const {
		register,
		handleSubmit,
		formState: { errors, isValid },
	} = usePromocodeForm(promocode)

	// Initialize mutations
	const createMutation = useCreatePromocode()
	const updateMutation = useUpdatePromocode()

	// Handle form submission
	const onSubmit = async (data: PromocodeFormData) => {
		try {
			if (isEditMode && promocode) {
				// Update existing promocode (Requirement 2.4, 2.7)
				await updateMutation.mutateAsync({
					id: promocode.id,
					data: {
						discount: data.discount,
						totalLimit: data.totalLimit,
						userLimit: data.userLimit,
						dateTo: data.dateTo,
						dateFrom: data.dateFrom,
					},
				})
			} else {
				// Create new promocode (Requirement 1.10, 1.14)
				await createMutation.mutateAsync({
					code: data.code,
					discount: data.discount,
					totalLimit: data.totalLimit,
					userLimit: data.userLimit,
					dateTo: data.dateTo,
					dateFrom: data.dateFrom,
				})
			}

			// Call success callback to close form and refresh table
			onSuccess()
		} catch (error) {
			// Errors are handled in mutations with toast notifications (Requirement 2.8)
			// No additional error handling needed here
		}
	}

	// Check if mutation is pending
	const isPending = createMutation.isPending || updateMutation.isPending

	return (
		<form onSubmit={handleSubmit(onSubmit)} className='space-y-6'>
			{/* Form Title */}
			<h2 className='text-xl font-semibold text-gray-900'>
				{isEditMode ? 'Редактировать промокод' : 'Создать промокод'}
			</h2>

			{/* Form Fields */}
			<PromocodeFormFields register={register} errors={errors} isEditMode={isEditMode} />

			{/* Form Actions */}
			<div className='flex gap-3 pt-4'>
				<button
					type='submit'
					disabled={!isValid || isPending}
					className={`px-4 py-2 rounded-md font-medium transition-colors ${
						!isValid || isPending
							? 'bg-gray-300 text-gray-500 cursor-not-allowed'
							: 'bg-blue-600 text-white hover:bg-blue-700'
					}`}
				>
					{isPending ? 'Сохранение...' : isEditMode ? 'Сохранить' : 'Создать'}
				</button>
				<button
					type='button'
					onClick={onCancel}
					disabled={isPending}
					className='px-4 py-2 border border-gray-300 rounded-md font-medium text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed'
				>
					Отмена
				</button>
			</div>
		</form>
	)
}
