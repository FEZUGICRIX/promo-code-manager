import { useState, useCallback } from 'react'
import { authApi } from '../api/authApi'
import type { User } from '@/entities/user'
import type { LoginDto, RegisterDto } from './types'

export function useAuth() {
	const [user, setUser] = useState<User | null>(null)
	const isAuthenticated = authApi.isAuthenticated()

	const login = useCallback(async (dto: LoginDto) => {
		const response = await authApi.login(dto)
		authApi.saveTokens(response.accessToken, response.refreshToken)
		setUser(response.user)
		return response
	}, [])

	const register = useCallback(async (dto: RegisterDto) => {
		const response = await authApi.register(dto)
		authApi.saveTokens(response.accessToken, response.refreshToken)
		setUser(response.user)
		return response
	}, [])

	const logout = useCallback(() => {
		authApi.logout()
		setUser(null)
		window.location.href = '/login'
	}, [])

	return { user, isAuthenticated, login, register, logout }
}
