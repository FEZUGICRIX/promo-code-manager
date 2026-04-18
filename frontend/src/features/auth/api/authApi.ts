import { api } from '@/shared/api'
import type { AuthResponse, LoginDto, RegisterDto } from '../model/types'

export const authApi = {
	login: async (dto: LoginDto): Promise<AuthResponse> => {
		const { data } = await api.post<AuthResponse>('/auth/login', dto)
		return data
	},

	register: async (dto: RegisterDto): Promise<AuthResponse> => {
		const { data } = await api.post<AuthResponse>('/auth/register', dto)
		return data
	},

	logout: async () => {
		// Call backend to clear the HttpOnly cookie
		try {
			await api.post('/auth/logout')
		} catch (error) {
			console.error('Logout error:', error)
		}
		// Clear accessToken from localStorage
		localStorage.removeItem('accessToken')
	},

	saveTokens: (accessToken: string) => {
		// Only save accessToken - refreshToken is in HttpOnly cookie
		localStorage.setItem('accessToken', accessToken)
	},

	isAuthenticated: (): boolean => {
		const token = localStorage.getItem('accessToken')
		if (!token) return false
		try {
			const payload = JSON.parse(atob(token.split('.')[1])) as { exp: number }
			return payload.exp * 1000 > Date.now()
		} catch {
			return false
		}
	},
}
