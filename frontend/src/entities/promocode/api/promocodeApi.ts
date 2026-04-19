/**
 * API сервис для работы с промокодами (CRUD операции)
 *
 * Все операции записи (create, update, deactivate) выполняются в MongoDB
 */

import { api } from '@/shared/api/instance'
import type { Promocode, CreatePromocodeDTO, UpdatePromocodeDTO } from '../model/types'

/**
 * API методы для работы с промокодами
 */
export const promocodeApi = {
	/**
	 * Создать новый промокод
	 *
	 * @param data - Данные для создания промокода
	 * @returns Созданный промокод
	 *
	 * @example
	 * ```ts
	 * const promocode = await promocodeApi.create({
	 *   code: 'SUMMER2024',
	 *   discount: 20,
	 *   totalLimit: 100,
	 *   userLimit: 1,
	 *   dateTo: '2024-12-31',
	 * })
	 * ```
	 */
	async create(data: CreatePromocodeDTO): Promise<Promocode> {
		const response = await api.post<Promocode>('/promocodes', data)
		return response.data
	},

	/**
	 * Обновить существующий промокод
	 *
	 * @param id - ID промокода
	 * @param data - Данные для обновления
	 * @returns Обновлённый промокод
	 *
	 * @example
	 * ```ts
	 * const promocode = await promocodeApi.update('123', {
	 *   discount: 25,
	 *   totalLimit: 150,
	 * })
	 * ```
	 */
	async update(id: string, data: UpdatePromocodeDTO): Promise<Promocode> {
		const response = await api.patch<Promocode>(`/promocodes/${id}`, data)
		return response.data
	},

	/**
	 * Деактивировать промокод
	 *
	 * @param id - ID промокода
	 * @returns Деактивированный промокод
	 *
	 * @example
	 * ```ts
	 * const promocode = await promocodeApi.deactivate('123')
	 * ```
	 */
	async deactivate(id: string): Promise<Promocode> {
		const response = await api.delete<Promocode>(`/promocodes/${id}`)
		return response.data
	},

	/**
	 * Получить промокод по ID
	 *
	 * @param id - ID промокода
	 * @returns Промокод
	 */
	async getById(id: string): Promise<Promocode> {
		const response = await api.get<Promocode>(`/promocodes/${id}`)
		return response.data
	},

	/**
	 * Получить список всех промокодов
	 *
	 * @returns Массив промокодов
	 */
	async getAll(): Promise<Promocode[]> {
		const response = await api.get<Promocode[]>('/promocodes')
		return response.data
	},
}
