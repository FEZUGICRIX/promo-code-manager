/**
 * Promocode Form Widget
 *
 * Виджет для создания и редактирования промокодов с валидацией
 */

// Model
export { promocodeValidationSchema } from './model/validation'
export type { PromocodeFormValidation } from './model/validation'
export type {
	PromocodeFormProps,
	PromocodeFormFieldsProps,
	UsePromocodeFormReturn,
} from './model/types'
export { usePromocodeForm } from './model/usePromocodeForm'

// UI
export { PromocodeForm } from './ui/PromocodeForm'
export { PromocodeFormFields } from './ui/PromocodeFormFields'
