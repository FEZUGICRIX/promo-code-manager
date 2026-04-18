import { useState, useCallback } from 'react'
import { authApi } from '../api/authApi'
import type { User } from '@/entities/user'
import type { LoginDto, RegisterDto } from './types'

export function useAuth() {
	const [user, setUser] = useState<User | null>(null)
	const isAuthenticated = authApi.isAuthenticated()

	const login = useCallback(async (dto: LoginDto) => {
		const response = await authApi.login(dto)
		// Only save accessToken - refreshToken is in HttpOnly cookie
		authApi.saveTokens(response.accessToken)
		// User is optional in login response
		if (response.user) {
			setUser(response.user)
		}
		return response
	}, [])

	const register = useCallback(async (dto: RegisterDto) => {
		const response = await authApi.register(dto)
		// Only save accessToken - refreshToken is in HttpOnly cookie
		authApi.saveTokens(response.accessToken)
		// User is present in register response
		if (response.user) {
			setUser(response.user)
		}
		return response
	}, [])

	const logout = useCallback(async () => {
		await authApi.logout()
		setUser(null)
		window.location.href = '/login'
	}, [])

	return { user, isAuthenticated, login, register, logout }
}
