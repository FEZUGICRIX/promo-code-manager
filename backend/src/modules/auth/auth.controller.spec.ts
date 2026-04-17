import { Test, TestingModule } from '@nestjs/testing'
import { INestApplication, ValidationPipe } from '@nestjs/common'
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler'
import { APP_GUARD } from '@nestjs/core'
// eslint-disable-next-line @typescript-eslint/no-require-imports
const request = require('supertest') as typeof import('supertest')

import { AuthController } from './auth.controller'
import { AuthService } from './auth.service'
import { ConflictException, UnauthorizedException } from '@nestjs/common'

// ── Mock AuthService ──────────────────────────────────────────────────────────

const mockAuthService = {
	register: jest.fn(),
	login: jest.fn(),
	refreshToken: jest.fn(),
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const validRegisterBody = {
	email: 'user@example.com',
	password: 'password123',
	name: 'John Doe',
	phone: '+79001234567',
}

const validLoginBody = {
	email: 'user@example.com',
	password: 'password123',
}

const mockUserResponse = {
	id: 'mock-id-123',
	email: 'user@example.com',
	name: 'John Doe',
	phone: '+79001234567',
	isActive: true,
	createdAt: new Date('2024-01-01').toISOString(),
	updatedAt: new Date('2024-01-01').toISOString(),
}

const mockTokens = {
	accessToken: 'mock.access.token',
	refreshToken: 'mock.refresh.token',
}

// ── Test Suite ────────────────────────────────────────────────────────────────

describe('AuthController (HTTP)', () => {
	let app: INestApplication

	beforeEach(async () => {
		jest.clearAllMocks()

		const module: TestingModule = await Test.createTestingModule({
			imports: [ThrottlerModule.forRoot([{ ttl: 60000, limit: 5 }])],
			controllers: [AuthController],
			providers: [
				{ provide: AuthService, useValue: mockAuthService },
				{ provide: APP_GUARD, useClass: ThrottlerGuard },
			],
		}).compile()

		app = module.createNestApplication()
		app.useGlobalPipes(
			new ValidationPipe({
				whitelist: true,
				forbidNonWhitelisted: true,
				transform: true,
			}),
		)
		await app.init()
	})

	afterEach(async () => {
		await app.close()
	})

	// ── POST /auth/register ───────────────────────────────────────────────────

	describe('POST /auth/register', () => {
		// Requirement 3.1: endpoint accepts RegisterDTO
		// Requirement 3.8: returns 201 with user (excluding passwordHash) and tokens
		it('should return 201 with user and tokens on successful registration', async () => {
			mockAuthService.register.mockResolvedValue({
				user: mockUserResponse,
				...mockTokens,
			})

			const res = await request(app.getHttpServer())
				.post('/auth/register')
				.send(validRegisterBody)
				.expect(201)

			expect(res.body).toMatchObject({
				user: {
					id: mockUserResponse.id,
					email: mockUserResponse.email,
					name: mockUserResponse.name,
					phone: mockUserResponse.phone,
					isActive: true,
				},
				accessToken: mockTokens.accessToken,
				refreshToken: mockTokens.refreshToken,
			})
		})

		// Requirement 3.8: passwordHash must not appear in the response
		it('should not include passwordHash in the response body', async () => {
			mockAuthService.register.mockResolvedValue({
				user: mockUserResponse,
				...mockTokens,
			})

			const res = await request(app.getHttpServer())
				.post('/auth/register')
				.send(validRegisterBody)
				.expect(201)

			expect(JSON.stringify(res.body)).not.toContain('passwordHash')
		})

		// Requirement 3.9: returns 409 when email already registered
		it('should return 409 when email is already registered', async () => {
			mockAuthService.register.mockRejectedValue(new ConflictException('Email already registered'))

			const res = await request(app.getHttpServer())
				.post('/auth/register')
				.send(validRegisterBody)
				.expect(409)

			expect(res.body.message).toBe('Email already registered')
		})

		// Requirement 3.1: ValidationPipe rejects invalid DTO
		it('should return 400 when required fields are missing', async () => {
			await request(app.getHttpServer())
				.post('/auth/register')
				.send({ email: 'user@example.com' })
				.expect(400)
		})

		it('should return 400 when email is invalid', async () => {
			await request(app.getHttpServer())
				.post('/auth/register')
				.send({ ...validRegisterBody, email: 'not-an-email' })
				.expect(400)
		})

		it('should return 400 when password is too short', async () => {
			await request(app.getHttpServer())
				.post('/auth/register')
				.send({ ...validRegisterBody, password: 'short' })
				.expect(400)
		})
	})

	// ── POST /auth/login ──────────────────────────────────────────────────────

	describe('POST /auth/login', () => {
		// Requirement 4.7: returns 200 with accessToken and refreshToken on valid login
		it('should return 200 with accessToken and refreshToken on valid credentials', async () => {
			mockAuthService.login.mockResolvedValue(mockTokens)

			const res = await request(app.getHttpServer())
				.post('/auth/login')
				.send(validLoginBody)
				.expect(200)

			expect(res.body).toMatchObject({
				accessToken: mockTokens.accessToken,
				refreshToken: mockTokens.refreshToken,
			})
		})

		// Requirement 4.4: returns 401 with "Invalid credentials" for non-existent email
		it('should return 401 with "Invalid credentials" for non-existent email', async () => {
			mockAuthService.login.mockRejectedValue(new UnauthorizedException('Invalid credentials'))

			const res = await request(app.getHttpServer())
				.post('/auth/login')
				.send({ email: 'ghost@example.com', password: 'password123' })
				.expect(401)

			expect(res.body.message).toBe('Invalid credentials')
		})

		// Requirement 4.5: returns 401 with "Invalid credentials" for wrong password
		it('should return 401 with "Invalid credentials" for wrong password', async () => {
			mockAuthService.login.mockRejectedValue(new UnauthorizedException('Invalid credentials'))

			const res = await request(app.getHttpServer())
				.post('/auth/login')
				.send({ email: 'user@example.com', password: 'wrongpassword' })
				.expect(401)

			expect(res.body.message).toBe('Invalid credentials')
		})

		// Requirement 4.6: returns 401 with "Account is disabled" for inactive user
		it('should return 401 with "Account is disabled" for inactive user', async () => {
			mockAuthService.login.mockRejectedValue(new UnauthorizedException('Account is disabled'))

			const res = await request(app.getHttpServer())
				.post('/auth/login')
				.send(validLoginBody)
				.expect(401)

			expect(res.body.message).toBe('Account is disabled')
		})

		// Requirement 4.8: returns 429 when rate limit exceeded (5 req/60s)
		it('should return 429 when rate limit is exceeded', async () => {
			mockAuthService.login.mockResolvedValue(mockTokens)

			// Make 5 successful requests to exhaust the limit
			for (let i = 0; i < 5; i++) {
				await request(app.getHttpServer()).post('/auth/login').send(validLoginBody)
			}

			// 6th request should be rate-limited
			await request(app.getHttpServer()).post('/auth/login').send(validLoginBody).expect(429)
		})

		it('should return 400 when login DTO is invalid', async () => {
			await request(app.getHttpServer())
				.post('/auth/login')
				.send({ email: 'not-an-email', password: 'pass' })
				.expect(400)
		})
	})

	// ── POST /auth/refresh ────────────────────────────────────────────────────

	describe('POST /auth/refresh', () => {
		// Requirement 5.2: returns 200 with new accessToken for valid refresh token
		it('should return 200 with new accessToken for a valid refresh token', async () => {
			mockAuthService.refreshToken.mockResolvedValue({ accessToken: 'new.access.token' })

			const res = await request(app.getHttpServer())
				.post('/auth/refresh')
				.send({ refreshToken: 'valid.refresh.token' })
				.expect(200)

			expect(res.body).toMatchObject({ accessToken: 'new.access.token' })
		})

		// Requirement 5.3: returns 401 for invalid/expired refresh token
		it('should return 401 for an invalid refresh token', async () => {
			mockAuthService.refreshToken.mockRejectedValue(
				new UnauthorizedException('Invalid or expired refresh token'),
			)

			const res = await request(app.getHttpServer())
				.post('/auth/refresh')
				.send({ refreshToken: 'invalid.token' })
				.expect(401)

			expect(res.body.message).toBe('Invalid or expired refresh token')
		})

		// Requirement 5.3: returns 401 for expired refresh token
		it('should return 401 for an expired refresh token', async () => {
			mockAuthService.refreshToken.mockRejectedValue(
				new UnauthorizedException('Invalid or expired refresh token'),
			)

			const res = await request(app.getHttpServer())
				.post('/auth/refresh')
				.send({ refreshToken: 'expired.jwt.token' })
				.expect(401)

			expect(res.body.message).toBe('Invalid or expired refresh token')
		})

		// Requirement 5.4: returns 401 for malformed JWT without unhandled exception
		it('should return 401 for a malformed JWT string without throwing unhandled exception', async () => {
			mockAuthService.refreshToken.mockRejectedValue(
				new UnauthorizedException('Invalid or expired refresh token'),
			)

			const res = await request(app.getHttpServer())
				.post('/auth/refresh')
				.send({ refreshToken: 'not.a.valid.jwt.at.all' })
				.expect(401)

			// Must be a proper HTTP 401, not an unhandled 500
			expect(res.status).toBe(401)
			expect(res.body.message).toBe('Invalid or expired refresh token')
		})

		it('should return 400 when refreshToken field is missing', async () => {
			await request(app.getHttpServer()).post('/auth/refresh').send({}).expect(400)
		})
	})
})
