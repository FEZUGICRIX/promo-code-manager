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

	// TODO: НЕ ХРАНИТЬ accessToken и refreshToken в localStorage
	logout: () => {
		localStorage.removeItem('accessToken')
		localStorage.removeItem('refreshToken')
	},

	saveTokens: (accessToken: string, refreshToken: string) => {
		localStorage.setItem('accessToken', accessToken)
		localStorage.setItem('refreshToken', refreshToken)
	},

	// TODO: НЕ ХРАНИТЬ accessToken и refreshToken в localStorage
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
