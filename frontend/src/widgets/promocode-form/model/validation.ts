import { z } from 'zod'

/**
 * Zod validation schema for Promocode Form
 *
 * Validates:
 * - code: 3-20 alphanumeric characters
 * - discount: 1-100
 * - totalLimit: positive integer
 * - userLimit: positive integer
 * - dateTo: future date
 * - dateFrom: optional, must be before dateTo if provided
 *
 * Requirements: 1.4, 1.5, 1.6, 1.7, 1.8, 1.9, 3.1
 */
export const promocodeValidationSchema = z
	.object({
		code: z
			.string()
			.min(3, 'Код должен содержать минимум 3 символа')
			.max(20, 'Код должен содержать максимум 20 символов')
			.regex(/^[A-Za-z0-9]+$/, 'Код может содержать только буквы и цифры'),

		discount: z
			.number({
				required_error: 'Скидка обязательна',
				invalid_type_error: 'Скидка должна быть числом',
			})
			.min(1, 'Скидка должна быть от 1 до 100')
			.max(100, 'Скидка должна быть от 1 до 100'),

		totalLimit: z
			.number({
				required_error: 'Общий лимит обязателен',
				invalid_type_error: 'Общий лимит должен быть числом',
			})
			.int('Общий лимит должен быть целым числом')
			.positive('Общий лимит должен быть больше 0'),

		userLimit: z
			.number({
				required_error: 'Лимит на пользователя обязателен',
				invalid_type_error: 'Лимит на пользователя должен быть числом',
			})
			.int('Лимит на пользователя должен быть целым числом')
			.positive('Лимит на пользователя должен быть больше 0'),

		dateTo: z
			.string({
				required_error: 'Дата истечения обязательна',
			})
			.refine(
				(date) => {
					const expirationDate = new Date(date)
					const now = new Date()
					// Reset time to compare only dates
					now.setHours(0, 0, 0, 0)
					expirationDate.setHours(0, 0, 0, 0)
					return expirationDate > now
				},
				{
					message: 'Дата истечения должна быть в будущем',
				},
			),

		dateFrom: z
			.string({
				required_error: 'Дата начала обязательна',
			})
			.min(1, 'Дата начала обязательна'),
	})
	.refine(
		(data) => {
			// If dateFrom is provided, validate that it's before dateTo
			if (data.dateFrom && data.dateTo) {
				const fromDate = new Date(data.dateFrom)
				const toDate = new Date(data.dateTo)
				return fromDate < toDate
			}
			return true
		},
		{
			message: 'Дата начала должна быть меньше даты истечения',
			path: ['dateFrom'],
		},
	)

/**
 * Type inferred from the validation schema
 */
export type PromocodeFormValidation = z.infer<typeof promocodeValidationSchema>
