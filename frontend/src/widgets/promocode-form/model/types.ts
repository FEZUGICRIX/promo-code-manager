/**
 * Types for Promocode Form Widget
 */

import type { PromocodeFormData } from '@/entities/promocode'
import type { AnalyticsPromocode } from '@/entities/analytics/model/types'

/**
 * Props for PromocodeForm component
 */
export interface PromocodeFormProps {
	/**
	 * Promocode to edit (null for create mode)
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
 * Props for PromocodeFormFields component
 */
export interface PromocodeFormFieldsProps {
	/**
	 * Whether the form is in edit mode
	 */
	isEditMode: boolean
}

/**
 * Return type for usePromocodeForm hook
 */
export interface UsePromocodeFormReturn {
	isEditMode: boolean
	defaultValues: PromocodeFormData
}
