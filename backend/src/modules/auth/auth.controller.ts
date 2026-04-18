import { Body, Controller, HttpCode, Post, Res } from '@nestjs/common'
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger'
import { Throttle } from '@nestjs/throttler'
import { Response } from 'express'

import { AuthService } from './auth.service'
import { RegisterDTO } from './dto/register.dto'
import { LoginDTO } from './dto/login.dto'

@ApiTags('auth')
@Controller('auth')
export class AuthController {
	constructor(private readonly authService: AuthService) {}

	@Post('register')
	@HttpCode(201)
	@ApiOperation({ summary: 'Register a new user' })
	@ApiResponse({ status: 201, description: 'User registered successfully' })
	@ApiResponse({ status: 409, description: 'Email already registered' })
	async register(@Body() dto: RegisterDTO, @Res({ passthrough: true }) res: Response) {
		const result = await this.authService.register(dto)

		// Set refreshToken as HttpOnly cookie
		this.setRefreshTokenCookie(res, result.refreshToken)

		// Return only accessToken and user in response body
		return {
			accessToken: result.accessToken,
			user: result.user,
		}
	}

	@Post('login')
	@HttpCode(200)
	@Throttle({ default: { limit: 5, ttl: 60000 } })
	@ApiOperation({ summary: 'Login with email and password' })
	@ApiResponse({ status: 200, description: 'Login successful' })
	@ApiResponse({ status: 401, description: 'Invalid credentials' })
	@ApiResponse({ status: 429, description: 'Too many requests' })
	async login(@Body() dto: LoginDTO, @Res({ passthrough: true }) res: Response) {
		const result = await this.authService.login(dto)

		// Set refreshToken as HttpOnly cookie
		this.setRefreshTokenCookie(res, result.refreshToken)

		// Return only accessToken in response body
		return {
			accessToken: result.accessToken,
		}
	}

	@Post('refresh')
	@HttpCode(200)
	@ApiOperation({ summary: 'Refresh access token' })
	@ApiResponse({ status: 200, description: 'Token refreshed successfully' })
	@ApiResponse({ status: 401, description: 'Invalid or expired refresh token' })
	async refresh(@Res({ passthrough: true }) res: Response) {
		// Extract refreshToken from cookie
		const refreshToken = res.req.cookies?.refreshToken

		if (!refreshToken) {
			res.status(401).json({ message: 'Refresh token not found' })
			return
		}

		const result = await this.authService.refreshToken(refreshToken)

		// Return only accessToken in response body
		return {
			accessToken: result.accessToken,
		}
	}

	@Post('logout')
	@HttpCode(200)
	@ApiOperation({ summary: 'Logout user' })
	@ApiResponse({ status: 200, description: 'Logout successful' })
	logout(@Res({ passthrough: true }) res: Response) {
		// Clear the refreshToken cookie
		res.clearCookie('refreshToken', {
			httpOnly: true,
			// TODO:  не использовать  process.env.NODE_ENV
			secure: process.env.NODE_ENV === 'production',
			sameSite: 'strict',
		})

		return { message: 'Logout successful' }
	}

	/**
	 * Helper method to set refreshToken as HttpOnly cookie
	 */
	private setRefreshTokenCookie(res: Response, refreshToken: string): void {
		res.cookie('refreshToken', refreshToken, {
			httpOnly: true, // Prevents XSS attacks
			// TODO:  не использовать  process.env.NODE_ENV
			secure: process.env.NODE_ENV === 'production', // HTTPS only in production
			sameSite: 'strict', // CSRF protection
			maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days in milliseconds
		})
	}
}
