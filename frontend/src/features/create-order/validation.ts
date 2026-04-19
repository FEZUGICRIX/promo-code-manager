import { z } from 'zod'

/**
 * Zod schema for create order form validation
 * Requirements: 1.2, 3.1
 */
export const createOrderSchema = z.object({
	amount: z.number({ invalid_type_error: 'Введите число' }).positive('Сумма должна быть больше 0'),
})
