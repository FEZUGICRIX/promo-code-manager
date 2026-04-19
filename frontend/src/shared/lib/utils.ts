import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { AxiosError } from 'axios'
import type { ApiError } from '@/shared/types'

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs))
}

/**
 * Removes undefined and empty string values from a params object
 *
 * @example
 * cleanParams({ page: 1, search: '', name: undefined }) // { page: 1 }
 */
export function cleanParams<T extends object>(params: T): Partial<T> {
	return Object.fromEntries(
		Object.entries(params).filter(([_, value]) => value !== undefined && value !== ''),
	) as Partial<T>
}

export function getErrorMessage(error: unknown): string {
	if (error instanceof AxiosError) {
		const msg = (error.response?.data as ApiError)?.message
		if (Array.isArray(msg)) return msg.join(', ')
		if (typeof msg === 'string') return msg
	}
	if (error instanceof Error) return error.message
	return 'Произошла ошибка'
}
