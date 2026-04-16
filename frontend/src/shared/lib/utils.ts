import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { AxiosError } from 'axios'
import type { ApiError } from '@/shared/types'

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs))
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
