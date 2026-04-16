import type { User } from '@/entities/user'

export interface LoginDto {
	email: string
	password: string
}

export interface RegisterDto {
	email: string
	password: string
	name: string
	phone: string
}

export interface AuthResponse {
	accessToken: string
	refreshToken: string
	user: User
}
