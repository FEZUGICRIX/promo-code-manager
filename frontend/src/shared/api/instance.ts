import axios, { AxiosError } from 'axios'
import type { ApiError } from '@/shared/types'

// TODO: пофиксить
export const api = axios.create({
	baseURL: import.meta.env.VITE_API_URL ?? 'http://localhost:3000',
	headers: { 'Content-Type': 'application/json' },
})

api.interceptors.request.use((config) => {
	const token = localStorage.getItem('accessToken')
	if (token) config.headers.Authorization = `Bearer ${token}`
	return config
})

api.interceptors.response.use(
	(res) => res,
	async (error: AxiosError<ApiError>) => {
		const original = error.config
		if (error.response?.status === 401 && original && !original.headers['_retry']) {
			original.headers['_retry'] = 'true'
			try {
				const refreshToken = localStorage.getItem('refreshToken')
				if (!refreshToken) throw new Error('No refresh token')
				const { data } = await axios.post(
					`${import.meta.env.VITE_API_URL ?? 'http://localhost:3000'}/auth/refresh`,
					{ refreshToken },
				)
				localStorage.setItem('accessToken', data.accessToken)
				original.headers.Authorization = `Bearer ${data.accessToken}`
				return api.request(original)
			} catch {
				localStorage.removeItem('accessToken')
				localStorage.removeItem('refreshToken')
				window.location.href = '/login'
			}
		}
		return Promise.reject(error)
	},
)
