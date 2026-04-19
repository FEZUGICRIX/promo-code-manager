import { z } from 'zod'
import { DiscountType } from '@/entities/promocode/model/types'

/**
 * Zod validation schema for Promocode Form
 */
export const promocodeValidationSchema = z
	.object({
		code: z
			.string()
			.min(3, 'Код должен содержать минимум 3 символа')
			.max(20, 'Код должен содержать максимум 20 символов')
			.regex(/^[A-Za-z0-9]+$/, 'Код может содержать только буквы и цифры'),

		discountType: z.nativeEnum(DiscountType, {
			required_error: 'Тип скидки обязателен',
		}),

		discount: z
			.number({
				required_error: 'Скидка обязательна',
				invalid_type_error: 'Скидка должна быть числом',
			})
			.min(1, 'Скидка должна быть больше 0'),

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
					now.setHours(0, 0, 0, 0)
					expirationDate.setHours(0, 0, 0, 0)
					return expirationDate > now
				},
				{ message: 'Дата истечения должна быть в будущем' },
			),

		dateFrom: z
			.string({
				required_error: 'Дата начала обязательна',
			})
			.min(1, 'Дата начала обязательна'),
	})
	.refine(
		(data) => {
			if (data.discountType === DiscountType.PERCENTAGE) {
				return data.discount <= 100
			}
			return true
		},
		{ message: 'Процентная скидка не может превышать 100%', path: ['discount'] },
	)
	.refine(
		(data) => {
			if (data.dateFrom && data.dateTo) {
				return new Date(data.dateFrom) < new Date(data.dateTo)
			}
			return true
		},
		{ message: 'Дата начала должна быть меньше даты истечения', path: ['dateFrom'] },
	)

export type PromocodeFormValidation = z.infer<typeof promocodeValidationSchema>
