import { Body, Controller, HttpCode, Post } from '@nestjs/common'
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger'
import { Throttle } from '@nestjs/throttler'

import { AuthService } from './auth.service'
import { RegisterDTO } from './dto/register.dto'
import { LoginDTO } from './dto/login.dto'
import { RefreshDTO } from './dto/refresh.dto'

@ApiTags('auth')
@Controller('auth')
export class AuthController {
	constructor(private readonly authService: AuthService) {}

	@Post('register')
	@HttpCode(201)
	@ApiOperation({ summary: 'Register a new user' })
	@ApiResponse({ status: 201, description: 'User registered successfully' })
	@ApiResponse({ status: 409, description: 'Email already registered' })
	register(@Body() dto: RegisterDTO) {
		return this.authService.register(dto)
	}

	@Post('login')
	@HttpCode(200)
	@Throttle({ default: { limit: 5, ttl: 60000 } })
	@ApiOperation({ summary: 'Login with email and password' })
	@ApiResponse({ status: 200, description: 'Login successful' })
	@ApiResponse({ status: 401, description: 'Invalid credentials' })
	@ApiResponse({ status: 429, description: 'Too many requests' })
	login(@Body() dto: LoginDTO) {
		return this.authService.login(dto)
	}

	@Post('refresh')
	@HttpCode(200)
	@ApiOperation({ summary: 'Refresh access token' })
	@ApiResponse({ status: 200, description: 'Token refreshed successfully' })
	@ApiResponse({ status: 401, description: 'Invalid or expired refresh token' })
	refresh(@Body() dto: RefreshDTO) {
		return this.authService.refreshToken(dto.refreshToken)
	}
}
