import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios'
import type { ApiError } from '@/shared/types'

// Константы для предотвращения опечаток
const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000'
const REFRESH_URL = `${BASE_URL}/auth/refresh`

const STORAGE_KEYS = {
	ACCESS: 'accessToken',
} as const

// Расширяем конфиг Axios для поддержки флага повтора
interface CustomAxiosConfig extends InternalAxiosRequestConfig {
	_retry?: boolean
}

export const api = axios.create({
	baseURL: BASE_URL,
	headers: { 'Content-Type': 'application/json' },
	withCredentials: true, // Enable sending cookies with requests
})

// --- Request Interceptor ---
api.interceptors.request.use((config) => {
	const token = localStorage.getItem(STORAGE_KEYS.ACCESS)
	if (token && config.headers) {
		config.headers.Authorization = `Bearer ${token}`
	}
	return config
})

// --- Response Interceptor ---
interface QueueEntry {
	resolve: (token: string | null) => void
	reject: (error: unknown) => void
}

let isRefreshing = false
let failedQueue: QueueEntry[] = []

const processQueue = (error: unknown, token: string | null = null) => {
	failedQueue.forEach((prom) => {
		if (error) prom.reject(error)
		else prom.resolve(token)
	})
	failedQueue = []
}

api.interceptors.response.use(
	(response) => response,
	async (error: AxiosError<ApiError>) => {
		const originalRequest = error.config as CustomAxiosConfig

		// Проверяем, что это 401 и мы еще не пытались повторить этот запрос
		if (error.response?.status === 401 && originalRequest && !originalRequest._retry) {
			if (isRefreshing) {
				// Если обновление уже идет, ставим запрос в очередь
				return new Promise((resolve, reject) => {
					failedQueue.push({ resolve, reject })
				})
					.then((token) => {
						originalRequest.headers.Authorization = `Bearer ${token}`
						return api.request(originalRequest)
					})
					.catch((err) => Promise.reject(err))
			}

			originalRequest._retry = true
			isRefreshing = true

			try {
				// Call refresh endpoint - refreshToken is automatically sent via cookie
				const { data } = await axios.post<{ accessToken: string }>(
					REFRESH_URL,
					{}, // Empty body - token is in cookie
					{
						withCredentials: true, // Important: send cookies with this request
					},
				)

				const newAccessToken = data.accessToken
				localStorage.setItem(STORAGE_KEYS.ACCESS, newAccessToken)

				// Обновляем заголовок текущего запроса и выполняем его
				api.defaults.headers.common['Authorization'] = `Bearer ${newAccessToken}`
				processQueue(null, newAccessToken)

				return api.request(originalRequest)
			} catch (refreshError) {
				// Если refresh-токен протух — логаут
				processQueue(refreshError, null)
				localStorage.removeItem(STORAGE_KEYS.ACCESS)

				if (typeof window !== 'undefined') {
					window.location.href = '/login'
				}
				return Promise.reject(refreshError)
			} finally {
				isRefreshing = false
			}
		}

		return Promise.reject(error)
	},
)
