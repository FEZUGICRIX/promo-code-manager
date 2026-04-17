import { Test, TestingModule } from '@nestjs/testing'
import { getModelToken } from '@nestjs/mongoose'
import { JwtService } from '@nestjs/jwt'
import { ConflictException, Logger, UnauthorizedException } from '@nestjs/common'
import fc from 'fast-check'

import { AuthService } from './auth.service'
import { User } from './schemas/user.schema'
import { ClickhouseService } from '@/core/clickhouse/clickhouse.service'

// ── Mock bcrypt globally to avoid real hashing (eliminates timeout issues) ───

jest.mock('bcrypt', () => ({
	hash: jest.fn().mockResolvedValue('$2b$10$mockedhash'),
	compare: jest.fn().mockResolvedValue(true),
}))

// ── Helpers ──────────────────────────────────────────────────────────────────

function makeUserDoc(overrides: Record<string, unknown> = {}) {
	return {
		id: 'mock-id-123',
		email: 'user@example.com',
		name: 'John Doe',
		phone: '+79001234567',
		isActive: true,
		passwordHash: '$2b$10$mockedhash',
		createdAt: new Date('2024-01-01'),
		updatedAt: new Date('2024-01-01'),
		...overrides,
	}
}

// ── Arbitraries ───────────────────────────────────────────────────────────────

const validEmail = fc
	.tuple(
		fc.stringMatching(/^[a-z]{3,8}$/),
		fc.stringMatching(/^[a-z]{3,8}$/),
		fc.constantFrom('com', 'org', 'net'),
	)
	.map(([local, domain, tld]) => `${local}@${domain}.${tld}`)

const validPassword = fc.string({ minLength: 8, maxLength: 32 })
const validName = fc.string({ minLength: 2, maxLength: 50 })
const validPhone = fc.string({ minLength: 10, maxLength: 15 }).filter((s) => s.trim().length >= 10)

const validRegisterDTO = fc.record({
	email: validEmail,
	password: validPassword,
	name: validName,
	phone: validPhone,
})

// ── Test Suite ────────────────────────────────────────────────────────────────

describe('AuthService', () => {
	let service: AuthService
	let mockUserModel: {
		create: jest.Mock
		findOne: jest.Mock
	}
	let mockJwtService: { sign: jest.Mock; verify: jest.Mock }
	let mockClickhouseService: { insert: jest.Mock }

	beforeEach(async () => {
		// Silence Logger.error so ClickHouse fire-and-forget failures don't flood console
		jest.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined)

		mockUserModel = {
			create: jest.fn(),
			findOne: jest.fn(),
		}

		mockJwtService = {
			sign: jest.fn().mockReturnValue('mock.jwt.token'),
			verify: jest.fn(),
		}

		mockClickhouseService = {
			insert: jest.fn().mockResolvedValue(undefined),
		}

		const module: TestingModule = await Test.createTestingModule({
			providers: [
				AuthService,
				{ provide: getModelToken(User.name), useValue: mockUserModel },
				{ provide: JwtService, useValue: mockJwtService },
				{ provide: ClickhouseService, useValue: mockClickhouseService },
			],
		}).compile()

		service = module.get<AuthService>(AuthService)
	})

	afterEach(() => {
		jest.clearAllMocks()
	})

	// ── Property 8: passwordHash never exposed in API responses ──────────────

	describe('Property 8: passwordHash never exposed in API responses', () => {
		// Feature: backend-infrastructure, Property 8: passwordHash never exposed in API responses
		// Validates: Requirements 3.8, 7.1
		it('should never include passwordHash in the register response for any valid RegisterDTO', async () => {
			await fc.assert(
				fc.asyncProperty(validRegisterDTO, async (dto) => {
					const doc = makeUserDoc({
						email: dto.email,
						name: dto.name,
						phone: dto.phone,
						passwordHash: '$2b$10$somehash',
					})

					mockUserModel.create.mockResolvedValue(doc)
					mockJwtService.sign.mockReturnValue('mock.jwt.token')

					const result = await service.register(dto)
					const serialized = JSON.stringify(result)

					expect(serialized).not.toContain('passwordHash')
					expect(result.user).not.toHaveProperty('passwordHash')
				}),
				{ numRuns: 50 },
			)
		})

		it('should not expose passwordHash even when the doc object contains it', async () => {
			await fc.assert(
				fc.asyncProperty(validRegisterDTO, fc.string({ minLength: 20 }), async (dto, fakeHash) => {
					const doc = makeUserDoc({
						email: dto.email,
						name: dto.name,
						phone: dto.phone,
						passwordHash: fakeHash,
					})

					mockUserModel.create.mockResolvedValue(doc)

					const result = await service.register(dto)
					const serialized = JSON.stringify(result)

					expect(serialized).not.toContain(fakeHash)
					expect(result.user).not.toHaveProperty('passwordHash')
				}),
				{ numRuns: 50 },
			)
		})

		it('should throw ConflictException on duplicate email without leaking passwordHash', async () => {
			await fc.assert(
				fc.asyncProperty(validRegisterDTO, async (dto) => {
					const duplicateError = Object.assign(new Error('duplicate key'), { code: 11000 })
					mockUserModel.create.mockRejectedValue(duplicateError)

					await expect(service.register(dto)).rejects.toThrow(ConflictException)
				}),
				{ numRuns: 50 },
			)
		})
	})

	// ── Property 9: Duplicate email returns 409 ───────────────────────────────

	describe('Property 9: Duplicate email returns 409', () => {
		// Feature: backend-infrastructure, Property 9: Duplicate email returns 409
		// Validates: Requirements 3.9
		it('should throw ConflictException on the second register call with the same email', async () => {
			await fc.assert(
				fc.asyncProperty(validEmail, async (email) => {
					const dto = {
						email,
						password: 'password123',
						name: 'Test User',
						phone: '+79001234567',
					}

					const doc = makeUserDoc({ email })

					// First call succeeds
					mockUserModel.create.mockResolvedValueOnce(doc)
					await expect(service.register(dto)).resolves.toBeDefined()

					// Second call simulates MongoDB duplicate key error (code 11000)
					const duplicateError = Object.assign(new Error('E11000 duplicate key error'), {
						code: 11000,
					})
					mockUserModel.create.mockRejectedValueOnce(duplicateError)

					await expect(service.register(dto)).rejects.toThrow(ConflictException)
				}),
				{ numRuns: 50 },
			)
		})

		it('should throw ConflictException regardless of other field values when email is duplicate', async () => {
			await fc.assert(
				fc.asyncProperty(
					validEmail,
					validPassword,
					validName,
					validPhone,
					async (email, password, name, phone) => {
						const duplicateError = Object.assign(new Error('E11000 duplicate key error'), {
							code: 11000,
						})
						mockUserModel.create.mockRejectedValue(duplicateError)

						await expect(service.register({ email, password, name, phone })).rejects.toThrow(
							ConflictException,
						)
					},
				),
				{ numRuns: 50 },
			)
		})
	})

	// ── Property 10: ClickHouse sync on registration ──────────────────────────

	describe('Property 10: ClickHouse sync on registration', () => {
		// Feature: backend-infrastructure, Property 10: ClickHouse sync on registration
		// Validates: Requirements 3.10
		it('should call ClickhouseService.insert with matching email, name, phone for any valid RegisterDTO', async () => {
			await fc.assert(
				fc.asyncProperty(validRegisterDTO, async (dto) => {
					// Clear mock state at the start of each iteration to avoid cross-iteration leaks
					mockClickhouseService.insert.mockClear()
					mockClickhouseService.insert.mockResolvedValue(undefined)

					const doc = makeUserDoc({
						email: dto.email,
						name: dto.name,
						phone: dto.phone,
					})
					mockUserModel.create.mockResolvedValue(doc)

					await service.register(dto)

					// Drain the microtask queue so the fire-and-forget insert resolves
					await new Promise<void>((resolve) => process.nextTick(resolve))

					expect(mockClickhouseService.insert).toHaveBeenCalledTimes(1)

					const [table, records] = mockClickhouseService.insert.mock.calls[0] as [
						string,
						Array<Record<string, unknown>>,
					]

					expect(table).toBe('users')
					expect(records).toHaveLength(1)
					expect(records[0]).toMatchObject({
						email: dto.email,
						name: dto.name,
						phone: dto.phone,
					})
				}),
				{ numRuns: 50 },
			)
		})
	})

	// ── Property 11: ClickHouse failure does not block registration ───────────

	describe('Property 11: ClickHouse failure does not block registration', () => {
		// Feature: backend-infrastructure, Property 11: ClickHouse failure does not block registration
		// Validates: Requirements 3.11
		it('should still return user and tokens when ClickHouse insert throws for any error', async () => {
			const clickhouseError = fc.oneof(
				fc.string({ minLength: 1 }).map((msg) => new Error(msg)),
				fc
					.record({ message: fc.string(), code: fc.integer() })
					.map((obj) => Object.assign(new Error(obj.message), { code: obj.code })),
				fc.constant(new Error('ClickHouse connection refused')),
				fc.constant(new Error('ClickHouse timeout')),
			)

			await fc.assert(
				fc.asyncProperty(validRegisterDTO, clickhouseError, async (dto, error) => {
					// Clear mock state at the start of each iteration
					mockClickhouseService.insert.mockClear()
					mockClickhouseService.insert.mockRejectedValue(error)

					const doc = makeUserDoc({
						email: dto.email,
						name: dto.name,
						phone: dto.phone,
					})
					mockUserModel.create.mockResolvedValue(doc)

					const result = await service.register(dto)

					// Drain the microtask queue so the fire-and-forget rejection is handled internally
					await new Promise<void>((resolve) => process.nextTick(resolve))

					expect(result).toHaveProperty('user')
					expect(result).toHaveProperty('accessToken')
					expect(result).toHaveProperty('refreshToken')
					expect(result.user.email).toBe(doc.email)
					expect(result.user).not.toHaveProperty('passwordHash')
				}),
				{ numRuns: 50 },
			)
		})

		it('should not throw an unhandled rejection when ClickHouse insert rejects', async () => {
			await fc.assert(
				fc.asyncProperty(validRegisterDTO, async (dto) => {
					mockClickhouseService.insert.mockClear()
					mockClickhouseService.insert.mockRejectedValue(new Error('ClickHouse unavailable'))

					const doc = makeUserDoc({ email: dto.email, name: dto.name, phone: dto.phone })
					mockUserModel.create.mockResolvedValue(doc)

					await expect(service.register(dto)).resolves.toBeDefined()

					await new Promise<void>((resolve) => process.nextTick(resolve))
				}),
				{ numRuns: 50 },
			)
		})
	})

	// ── Property 13: Valid refresh token returns new accessToken ─────────────

	describe('Property 13: Valid refresh token returns new accessToken', () => {
		// Feature: backend-infrastructure, Property 13: Valid refresh token returns new accessToken
		// Validates: Requirements 5.2
		it('should return a new accessToken for any valid JwtPayload', async () => {
			const jwtPayload = fc.record({
				sub: fc.string({ minLength: 1, maxLength: 64 }),
				email: validEmail,
			})

			await fc.assert(
				fc.asyncProperty(jwtPayload, async (payload) => {
					const expectedToken = `new.access.token.${payload.sub}`
					mockJwtService.verify.mockReturnValue(payload)
					mockJwtService.sign.mockReturnValue(expectedToken)

					const result = await service.refreshToken('valid.refresh.token')

					expect(result).toHaveProperty('accessToken')
					expect(result.accessToken).toBe(expectedToken)
					expect(mockJwtService.verify).toHaveBeenCalledWith('valid.refresh.token')
					expect(mockJwtService.sign).toHaveBeenCalledWith(
						{ sub: payload.sub, email: payload.email },
						{ expiresIn: '15m' },
					)
				}),
				{ numRuns: 100 },
			)
		})

		it('should return only accessToken (not refreshToken) from refreshToken()', async () => {
			const jwtPayload = fc.record({
				sub: fc.string({ minLength: 1, maxLength: 64 }),
				email: validEmail,
			})

			await fc.assert(
				fc.asyncProperty(jwtPayload, async (payload) => {
					mockJwtService.verify.mockReturnValue(payload)
					mockJwtService.sign.mockReturnValue('new.access.token')

					const result = await service.refreshToken('valid.refresh.token')

					expect(Object.keys(result)).toEqual(['accessToken'])
					expect(result).not.toHaveProperty('refreshToken')
				}),
				{ numRuns: 100 },
			)
		})
	})

	// ── Property 14: Invalid/malformed refresh token returns 401 ────────────────

	describe('Property 14: Invalid/malformed refresh token returns 401', () => {
		// Feature: backend-infrastructure, Property 14: Invalid/malformed refresh token returns 401
		// Validates: Requirements 5.3, 5.4
		it('should throw UnauthorizedException for any string that is not a valid JWT', async () => {
			const invalidToken = fc.oneof(
				fc.string(),
				fc.constant(''),
				fc.constant('not.a.jwt'),
				fc.constant('Bearer invalid'),
				fc.string({ minLength: 1, maxLength: 64 }),
			)

			await fc.assert(
				fc.asyncProperty(invalidToken, async (token) => {
					mockJwtService.verify.mockImplementation(() => {
						throw new Error('invalid token')
					})

					await expect(service.refreshToken(token)).rejects.toThrow(UnauthorizedException)
				}),
				{ numRuns: 100 },
			)
		})

		it('should throw UnauthorizedException without unhandled exceptions for expired tokens', async () => {
			await fc.assert(
				fc.asyncProperty(fc.string({ minLength: 1 }), async (token) => {
					mockJwtService.verify.mockImplementation(() => {
						const err = new Error('jwt expired')
						Object.assign(err, { name: 'TokenExpiredError' })
						throw err
					})

					await expect(service.refreshToken(token)).rejects.toThrow(UnauthorizedException)
					await expect(service.refreshToken(token)).rejects.toThrow(
						'Invalid or expired refresh token',
					)
				}),
				{ numRuns: 100 },
			)
		})

		it('should throw UnauthorizedException for malformed JWT structure', async () => {
			// Malformed JWTs: wrong number of segments, invalid base64, etc.
			const malformedJwt = fc.oneof(
				fc.string().filter((s) => !s.includes('.')),
				fc.tuple(fc.string(), fc.string()).map(([a, b]) => `${a}.${b}`), // only 2 segments
				fc
					.tuple(fc.string(), fc.string(), fc.string(), fc.string())
					.map(([a, b, c, d]) => `${a}.${b}.${c}.${d}`), // 4 segments
			)

			await fc.assert(
				fc.asyncProperty(malformedJwt, async (token) => {
					mockJwtService.verify.mockImplementation(() => {
						throw new Error('jwt malformed')
					})

					await expect(service.refreshToken(token)).rejects.toThrow(UnauthorizedException)
				}),
				{ numRuns: 100 },
			)
		})
	})

	// ── Property 12: Invalid credentials always return 401 ────────────────────

	describe('Property 12: Invalid credentials always return 401', () => {
		// Feature: backend-infrastructure, Property 12: Invalid credentials always return 401
		// Validates: Requirements 4.4, 4.5

		it('should throw UnauthorizedException for any email that does not exist in the database', async () => {
			await fc.assert(
				fc.asyncProperty(validEmail, validPassword, async (email, password) => {
					mockUserModel.findOne.mockReturnValue({
						select: jest.fn().mockReturnValue({
							exec: jest.fn().mockResolvedValue(null),
						}),
					})

					await expect(service.login({ email, password })).rejects.toThrow(UnauthorizedException)
				}),
				{ numRuns: 50 },
			)
		})

		it('should throw UnauthorizedException for any password that does not match the stored hash', async () => {
			// bcrypt.compare is mocked globally to return true by default.
			// Override it to return false for this test to simulate a wrong password.
			const bcrypt = jest.requireMock<{ compare: jest.Mock }>('bcrypt')

			await fc.assert(
				fc.asyncProperty(validEmail, validPassword, async (email, wrongPassword) => {
					bcrypt.compare.mockResolvedValue(false)

					const doc = makeUserDoc({
						email: email.toLowerCase(),
						passwordHash: '$2b$10$mockedhash',
						isActive: true,
					})

					mockUserModel.findOne.mockReturnValue({
						select: jest.fn().mockReturnValue({
							exec: jest.fn().mockResolvedValue(doc),
						}),
					})

					await expect(service.login({ email, password: wrongPassword })).rejects.toThrow(
						UnauthorizedException,
					)
				}),
				{ numRuns: 50 },
			)
		})
	})
})

// ── Unit Tests: AuthService ───────────────────────────────────────────────────
// Feature: backend-infrastructure
// Covers: bcrypt hashing, token generation, error paths
// Requirements: 3.6–3.11, 4.4–4.7, 5.2–5.4

describe('AuthService — unit tests', () => {
	let service: AuthService
	let mockUserModel: { create: jest.Mock; findOne: jest.Mock }
	let mockJwtService: { sign: jest.Mock; verify: jest.Mock }
	let mockClickhouseService: { insert: jest.Mock }
	let bcrypt: { hash: jest.Mock; compare: jest.Mock }

	beforeEach(async () => {
		jest.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined)

		bcrypt = jest.requireMock('bcrypt')
		bcrypt.hash.mockResolvedValue('$2b$10$mockedhash')
		bcrypt.compare.mockResolvedValue(true)

		mockUserModel = { create: jest.fn(), findOne: jest.fn() }
		mockJwtService = {
			sign: jest.fn().mockReturnValue('mock.jwt.token'),
			verify: jest.fn(),
		}
		mockClickhouseService = { insert: jest.fn().mockResolvedValue(undefined) }

		const module: TestingModule = await Test.createTestingModule({
			providers: [
				AuthService,
				{ provide: getModelToken(User.name), useValue: mockUserModel },
				{ provide: JwtService, useValue: mockJwtService },
				{ provide: ClickhouseService, useValue: mockClickhouseService },
			],
		}).compile()

		service = module.get<AuthService>(AuthService)
	})

	afterEach(() => jest.clearAllMocks())

	// ── register: bcrypt ──────────────────────────────────────────────────────

	describe('register — bcrypt', () => {
		it('should hash the password with bcrypt cost factor 10 before storing', async () => {
			// Requirement 3.6
			const doc = makeUserDoc()
			mockUserModel.create.mockResolvedValue(doc)

			await service.register({
				email: 'user@example.com',
				password: 'plaintext123',
				name: 'John',
				phone: '+79001234567',
			})

			expect(bcrypt.hash).toHaveBeenCalledWith('plaintext123', 10)
		})

		it('should store the hashed value (not the plain password) via userModel.create', async () => {
			// Requirement 3.6, 3.7
			bcrypt.hash.mockResolvedValue('$2b$10$hashedvalue')
			const doc = makeUserDoc({ passwordHash: '$2b$10$hashedvalue' })
			mockUserModel.create.mockResolvedValue(doc)

			await service.register({
				email: 'user@example.com',
				password: 'plaintext123',
				name: 'John',
				phone: '+79001234567',
			})

			const createArg = mockUserModel.create.mock.calls[0][0] as Record<string, unknown>
			expect(createArg.passwordHash).toBe('$2b$10$hashedvalue')
			expect(createArg).not.toHaveProperty('password')
		})

		it('should store user with isActive: true by default', async () => {
			// Requirement 3.7
			const doc = makeUserDoc({ isActive: true })
			mockUserModel.create.mockResolvedValue(doc)

			const result = await service.register({
				email: 'user@example.com',
				password: 'password123',
				name: 'John',
				phone: '+79001234567',
			})

			expect(result.user.isActive).toBe(true)
		})
	})

	// ── register: token generation ────────────────────────────────────────────

	describe('register — token generation', () => {
		it('should return accessToken with 15m expiry', async () => {
			// Requirement 3.8
			const doc = makeUserDoc()
			mockUserModel.create.mockResolvedValue(doc)

			await service.register({
				email: 'user@example.com',
				password: 'password123',
				name: 'John',
				phone: '+79001234567',
			})

			const signCalls = mockJwtService.sign.mock.calls as Array<[unknown, { expiresIn: string }]>
			const accessTokenCall = signCalls.find((c) => c[1]?.expiresIn === '15m')
			expect(accessTokenCall).toBeDefined()
		})

		it('should return refreshToken with 7d expiry', async () => {
			// Requirement 3.8
			const doc = makeUserDoc()
			mockUserModel.create.mockResolvedValue(doc)

			await service.register({
				email: 'user@example.com',
				password: 'password123',
				name: 'John',
				phone: '+79001234567',
			})

			const signCalls = mockJwtService.sign.mock.calls as Array<[unknown, { expiresIn: string }]>
			const refreshTokenCall = signCalls.find((c) => c[1]?.expiresIn === '7d')
			expect(refreshTokenCall).toBeDefined()
		})

		it('should sign tokens with payload containing sub (user id) and email', async () => {
			// Requirement 3.8
			const doc = makeUserDoc({ id: 'user-id-abc', email: 'user@example.com' })
			mockUserModel.create.mockResolvedValue(doc)

			await service.register({
				email: 'user@example.com',
				password: 'password123',
				name: 'John',
				phone: '+79001234567',
			})

			const signCalls = mockJwtService.sign.mock.calls as Array<
				[{ sub: string; email: string }, unknown]
			>
			expect(signCalls[0][0]).toMatchObject({ sub: 'user-id-abc', email: 'user@example.com' })
		})

		it('should return both accessToken and refreshToken in the response', async () => {
			// Requirement 3.8
			mockJwtService.sign
				.mockReturnValueOnce('access.token.value')
				.mockReturnValueOnce('refresh.token.value')
			const doc = makeUserDoc()
			mockUserModel.create.mockResolvedValue(doc)

			const result = await service.register({
				email: 'user@example.com',
				password: 'password123',
				name: 'John',
				phone: '+79001234567',
			})

			expect(result.accessToken).toBe('access.token.value')
			expect(result.refreshToken).toBe('refresh.token.value')
		})
	})

	// ── register: error paths ─────────────────────────────────────────────────

	describe('register — error paths', () => {
		it('should throw ConflictException when MongoDB returns duplicate key error (code 11000)', async () => {
			// Requirement 3.9
			const dupError = Object.assign(new Error('E11000 duplicate key'), { code: 11000 })
			mockUserModel.create.mockRejectedValue(dupError)

			await expect(
				service.register({
					email: 'dup@example.com',
					password: 'password123',
					name: 'John',
					phone: '+79001234567',
				}),
			).rejects.toThrow(ConflictException)
		})

		it('should re-throw non-duplicate errors from userModel.create', async () => {
			// Requirement 3.6 — unexpected DB errors should propagate
			const dbError = new Error('DB connection lost')
			mockUserModel.create.mockRejectedValue(dbError)

			await expect(
				service.register({
					email: 'user@example.com',
					password: 'password123',
					name: 'John',
					phone: '+79001234567',
				}),
			).rejects.toThrow('DB connection lost')
		})

		it('should not throw when ClickHouse insert fails (fire-and-forget)', async () => {
			// Requirement 3.11
			mockClickhouseService.insert.mockRejectedValue(new Error('ClickHouse down'))
			const doc = makeUserDoc()
			mockUserModel.create.mockResolvedValue(doc)

			await expect(
				service.register({
					email: 'user@example.com',
					password: 'password123',
					name: 'John',
					phone: '+79001234567',
				}),
			).resolves.toBeDefined()

			// Drain microtask queue so the rejection is handled internally
			await new Promise<void>((resolve) => process.nextTick(resolve))
		})

		it('should call ClickhouseService.insert with correct table and user fields', async () => {
			// Requirement 3.10
			const doc = makeUserDoc({
				id: 'ch-user-id',
				email: 'ch@example.com',
				name: 'CH User',
				phone: '+79009998877',
			})
			mockUserModel.create.mockResolvedValue(doc)

			await service.register({
				email: 'ch@example.com',
				password: 'password123',
				name: 'CH User',
				phone: '+79009998877',
			})

			await new Promise<void>((resolve) => process.nextTick(resolve))

			expect(mockClickhouseService.insert).toHaveBeenCalledWith(
				'users',
				expect.arrayContaining([
					expect.objectContaining({
						id: 'ch-user-id',
						email: 'ch@example.com',
						name: 'CH User',
						phone: '+79009998877',
					}),
				]),
			)
		})
	})

	// ── login: bcrypt comparison ──────────────────────────────────────────────

	describe('login — bcrypt comparison', () => {
		it('should call bcrypt.compare with the provided password and stored hash', async () => {
			// Requirement 4.4
			const doc = makeUserDoc({ passwordHash: '$2b$10$storedHash', isActive: true })
			mockUserModel.findOne.mockReturnValue({
				select: jest.fn().mockReturnValue({ exec: jest.fn().mockResolvedValue(doc) }),
			})

			await service.login({ email: 'user@example.com', password: 'mypassword' })

			expect(bcrypt.compare).toHaveBeenCalledWith('mypassword', '$2b$10$storedHash')
		})

		it('should query MongoDB with +passwordHash select', async () => {
			// Requirement 4.4 — must explicitly select passwordHash (select: false on schema)
			const selectMock = jest.fn().mockReturnValue({ exec: jest.fn().mockResolvedValue(null) })
			mockUserModel.findOne.mockReturnValue({ select: selectMock })

			await expect(service.login({ email: 'user@example.com', password: 'pass' })).rejects.toThrow(
				UnauthorizedException,
			)

			expect(selectMock).toHaveBeenCalledWith('+passwordHash')
		})

		it('should lowercase the email when querying MongoDB', async () => {
			// Requirement 4.1 — email lookup should be case-insensitive
			const execMock = jest.fn().mockResolvedValue(null)
			const selectMock = jest.fn().mockReturnValue({ exec: execMock })
			mockUserModel.findOne.mockReturnValue({ select: selectMock })

			await expect(service.login({ email: 'USER@EXAMPLE.COM', password: 'pass' })).rejects.toThrow(
				UnauthorizedException,
			)

			expect(mockUserModel.findOne).toHaveBeenCalledWith({ email: 'user@example.com' })
		})

		it('should throw UnauthorizedException with "Invalid credentials" when user not found', async () => {
			// Requirement 4.4
			mockUserModel.findOne.mockReturnValue({
				select: jest.fn().mockReturnValue({ exec: jest.fn().mockResolvedValue(null) }),
			})

			await expect(service.login({ email: 'ghost@example.com', password: 'pass' })).rejects.toThrow(
				new UnauthorizedException('Invalid credentials'),
			)
		})

		it('should throw UnauthorizedException with "Invalid credentials" when password does not match', async () => {
			// Requirement 4.5
			bcrypt.compare.mockResolvedValue(false)
			const doc = makeUserDoc({ isActive: true })
			mockUserModel.findOne.mockReturnValue({
				select: jest.fn().mockReturnValue({ exec: jest.fn().mockResolvedValue(doc) }),
			})

			await expect(
				service.login({ email: 'user@example.com', password: 'wrongpass' }),
			).rejects.toThrow(new UnauthorizedException('Invalid credentials'))
		})

		it('should throw UnauthorizedException with "Account is disabled" when isActive is false', async () => {
			// Requirement 4.6
			const doc = makeUserDoc({ isActive: false })
			mockUserModel.findOne.mockReturnValue({
				select: jest.fn().mockReturnValue({ exec: jest.fn().mockResolvedValue(doc) }),
			})

			await expect(
				service.login({ email: 'user@example.com', password: 'password123' }),
			).rejects.toThrow(new UnauthorizedException('Account is disabled'))
		})
	})

	// ── login: token generation ───────────────────────────────────────────────

	describe('login — token generation', () => {
		it('should return accessToken and refreshToken on successful login', async () => {
			// Requirement 4.7
			mockJwtService.sign
				.mockReturnValueOnce('login.access.token')
				.mockReturnValueOnce('login.refresh.token')
			const doc = makeUserDoc({ isActive: true })
			mockUserModel.findOne.mockReturnValue({
				select: jest.fn().mockReturnValue({ exec: jest.fn().mockResolvedValue(doc) }),
			})

			const result = await service.login({ email: 'user@example.com', password: 'password123' })

			expect(result).toEqual({
				accessToken: 'login.access.token',
				refreshToken: 'login.refresh.token',
			})
		})

		it('should sign tokens with sub and email from the found user document', async () => {
			// Requirement 4.7
			const doc = makeUserDoc({ id: 'login-user-id', email: 'login@example.com', isActive: true })
			mockUserModel.findOne.mockReturnValue({
				select: jest.fn().mockReturnValue({ exec: jest.fn().mockResolvedValue(doc) }),
			})

			await service.login({ email: 'login@example.com', password: 'password123' })

			const signCalls = mockJwtService.sign.mock.calls as Array<
				[{ sub: string; email: string }, unknown]
			>
			expect(signCalls[0][0]).toMatchObject({ sub: 'login-user-id', email: 'login@example.com' })
		})
	})

	// ── generateTokens ────────────────────────────────────────────────────────

	describe('generateTokens', () => {
		it('should sign accessToken with expiresIn 15m', () => {
			// Requirement 3.8, 4.7
			service.generateTokens({ sub: 'uid', email: 'u@e.com' })

			const signCalls = mockJwtService.sign.mock.calls as Array<[unknown, { expiresIn: string }]>
			expect(signCalls.some((c) => c[1]?.expiresIn === '15m')).toBe(true)
		})

		it('should sign refreshToken with expiresIn 7d', () => {
			// Requirement 3.8, 4.7
			service.generateTokens({ sub: 'uid', email: 'u@e.com' })

			const signCalls = mockJwtService.sign.mock.calls as Array<[unknown, { expiresIn: string }]>
			expect(signCalls.some((c) => c[1]?.expiresIn === '7d')).toBe(true)
		})

		it('should return both accessToken and refreshToken', () => {
			mockJwtService.sign.mockReturnValueOnce('at').mockReturnValueOnce('rt')

			const tokens = service.generateTokens({ sub: 'uid', email: 'u@e.com' })

			expect(tokens).toEqual({ accessToken: 'at', refreshToken: 'rt' })
		})
	})

	// ── refreshToken: error paths ─────────────────────────────────────────────

	describe('refreshToken — error paths', () => {
		it('should throw UnauthorizedException when jwtService.verify throws', async () => {
			// Requirement 5.3
			mockJwtService.verify.mockImplementation(() => {
				throw new Error('jwt expired')
			})

			await expect(service.refreshToken('expired.token')).rejects.toThrow(
				new UnauthorizedException('Invalid or expired refresh token'),
			)
		})

		it('should not re-throw the raw JWT error (must wrap in UnauthorizedException)', async () => {
			// Requirement 5.4 — raw Error must be wrapped, not propagated directly
			mockJwtService.verify.mockImplementation(() => {
				throw new Error('jwt malformed')
			})

			const rejection = service.refreshToken('bad.token')
			await expect(rejection).rejects.toBeInstanceOf(UnauthorizedException)
			// Verify the message is the wrapped one, not the raw JWT error message
			await expect(service.refreshToken('bad.token')).rejects.toThrow(
				'Invalid or expired refresh token',
			)
		})

		it('should return only accessToken (not refreshToken) on success', async () => {
			// Requirement 5.2
			mockJwtService.verify.mockReturnValue({ sub: 'uid', email: 'u@e.com' })
			mockJwtService.sign.mockReturnValue('new.access.token')

			const result = await service.refreshToken('valid.refresh.token')

			expect(result).toEqual({ accessToken: 'new.access.token' })
			expect(result).not.toHaveProperty('refreshToken')
		})

		it('should sign the new accessToken with the payload from the verified refresh token', async () => {
			// Requirement 5.2
			const payload = { sub: 'user-123', email: 'test@example.com' }
			mockJwtService.verify.mockReturnValue(payload)

			await service.refreshToken('valid.refresh.token')

			expect(mockJwtService.sign).toHaveBeenCalledWith(
				{ sub: 'user-123', email: 'test@example.com' },
				{ expiresIn: '15m' },
			)
		})
	})
})
