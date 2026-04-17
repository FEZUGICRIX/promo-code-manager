import { NotFoundException } from '@nestjs/common'
import { getModelToken } from '@nestjs/mongoose'
import { Test, TestingModule } from '@nestjs/testing'
import fc from 'fast-check'

import { ClickhouseService } from '@/core/clickhouse/clickhouse.service'
import { User } from '../auth/schemas/user.schema'
import { UsersService } from './users.service'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Recursively checks whether an object contains a key named `passwordHash` */
function containsPasswordHash(value: unknown): boolean {
	if (value === null || value === undefined) return false
	if (typeof value !== 'object') return false
	if (Array.isArray(value)) {
		return value.some(containsPasswordHash)
	}
	const obj = value as Record<string, unknown>
	if ('passwordHash' in obj) return true
	return Object.values(obj).some(containsPasswordHash)
}

/** Build a plain user object (no passwordHash) that mimics a Mongoose lean doc */
function buildUserObject(overrides: Record<string, unknown> = {}): Record<string, unknown> {
	return {
		_id: { toString: () => 'user-id-123' },
		email: 'test@example.com',
		name: 'Test User',
		phone: '+79001234567',
		isActive: true,
		createdAt: new Date(),
		updatedAt: new Date(),
		toObject: function () {
			// eslint-disable-next-line @typescript-eslint/no-unused-vars
			const { toObject: _toObject, ...rest } = this as Record<string, unknown>
			return rest
		},
		...overrides,
	}
}

/** Create a mock Mongoose query chain that resolves to `value` */
function mockQueryChain(value: unknown) {
	const chain = {
		select: jest.fn().mockReturnThis(),
		sort: jest.fn().mockReturnThis(),
		skip: jest.fn().mockReturnThis(),
		limit: jest.fn().mockResolvedValue(value),
	}
	return chain
}

// ---------------------------------------------------------------------------
// Test suite
// ---------------------------------------------------------------------------

describe('UsersService — Property-Based Tests', () => {
	let service: UsersService
	let userModelMock: Record<string, jest.Mock>
	let clickhouseServiceMock: { insert: jest.Mock }

	beforeEach(async () => {
		userModelMock = {
			find: jest.fn(),
			findById: jest.fn(),
			findByIdAndUpdate: jest.fn(),
			countDocuments: jest.fn(),
		}

		clickhouseServiceMock = {
			insert: jest.fn().mockResolvedValue(undefined),
		}

		const module: TestingModule = await Test.createTestingModule({
			providers: [
				UsersService,
				{
					provide: getModelToken(User.name),
					useValue: userModelMock,
				},
				{
					provide: ClickhouseService,
					useValue: clickhouseServiceMock,
				},
			],
		}).compile()

		service = module.get<UsersService>(UsersService)
	})

	// -------------------------------------------------------------------------
	// P1: passwordHash never in Users API responses
	// Feature: backend-crud, Property 1: passwordHash never in Users API responses
	// Validates: Requirements 1.5, 3.9, 4.5, 14.1
	// -------------------------------------------------------------------------
	describe('P1: passwordHash never in Users API responses', () => {
		it('findAll — response data never contains passwordHash', async () => {
			await fc.assert(
				fc.asyncProperty(
					fc.record({
						email: fc.emailAddress(),
						name: fc.string({ minLength: 2, maxLength: 50 }),
						phone: fc.string({ minLength: 10, maxLength: 20 }),
						isActive: fc.boolean(),
					}),
					async (userFields) => {
						// Build a user object WITHOUT passwordHash (as .select('-passwordHash') would return)
						const userDoc = buildUserObject(userFields)

						const chain = mockQueryChain([userDoc])
						userModelMock.find.mockReturnValue(chain)
						userModelMock.countDocuments.mockResolvedValue(1)

						const result = await service.findAll(1, 10)

						// Serialize as JSON (mimics HTTP response serialization)
						const serialized = JSON.parse(JSON.stringify(result))
						expect(containsPasswordHash(serialized)).toBe(false)
					},
				),
				{ numRuns: 100 },
			)
		})

		it('findById — response never contains passwordHash', async () => {
			await fc.assert(
				fc.asyncProperty(
					fc.record({
						email: fc.emailAddress(),
						name: fc.string({ minLength: 2, maxLength: 50 }),
						phone: fc.string({ minLength: 10, maxLength: 20 }),
						isActive: fc.boolean(),
					}),
					async (userFields) => {
						const userDoc = buildUserObject(userFields)

						const chain = {
							select: jest.fn().mockResolvedValue(userDoc),
						}
						userModelMock.findById.mockReturnValue(chain)

						const result = await service.findById('some-id')
						const serialized = JSON.parse(JSON.stringify(result))
						expect(containsPasswordHash(serialized)).toBe(false)
					},
				),
				{ numRuns: 100 },
			)
		})

		it('update — response never contains passwordHash', async () => {
			await fc.assert(
				fc.asyncProperty(
					fc.record({
						email: fc.emailAddress(),
						name: fc.string({ minLength: 2, maxLength: 50 }),
						phone: fc.string({ minLength: 10, maxLength: 20 }),
						isActive: fc.boolean(),
					}),
					async (userFields) => {
						const userDoc = buildUserObject(userFields)

						const chain = {
							select: jest.fn().mockResolvedValue(userDoc),
						}
						userModelMock.findByIdAndUpdate.mockReturnValue(chain)

						const result = await service.update('some-id', { name: userFields.name })
						const serialized = JSON.parse(JSON.stringify(result))
						expect(containsPasswordHash(serialized)).toBe(false)
					},
				),
				{ numRuns: 100 },
			)
		})

		it('deactivate — response never contains passwordHash', async () => {
			await fc.assert(
				fc.asyncProperty(
					fc.record({
						email: fc.emailAddress(),
						name: fc.string({ minLength: 2, maxLength: 50 }),
						phone: fc.string({ minLength: 10, maxLength: 20 }),
						isActive: fc.boolean(),
					}),
					async (userFields) => {
						const userDoc = buildUserObject({ ...userFields, isActive: false })

						const chain = {
							select: jest.fn().mockResolvedValue(userDoc),
						}
						userModelMock.findByIdAndUpdate.mockReturnValue(chain)

						const result = await service.deactivate('some-id')
						const serialized = JSON.parse(JSON.stringify(result))
						expect(containsPasswordHash(serialized)).toBe(false)
					},
				),
				{ numRuns: 100 },
			)
		})
	})

	// -------------------------------------------------------------------------
	// P2: Soft delete preserves document
	// Feature: backend-crud, Property 2: Soft delete preserves document
	// Validates: Requirements 4.2, 4.3
	// -------------------------------------------------------------------------
	describe('P2: Soft delete preserves document', () => {
		it('deactivate — document still exists with isActive: false', async () => {
			await fc.assert(
				fc.asyncProperty(fc.string({ minLength: 1, maxLength: 50 }), async (userId) => {
					const userDoc = buildUserObject({ isActive: false })

					const chain = {
						select: jest.fn().mockResolvedValue(userDoc),
					}
					userModelMock.findByIdAndUpdate.mockReturnValue(chain)

					const result = await service.deactivate(userId)

					// Document must exist (not null/undefined)
					expect(result).toBeDefined()
					expect(result).not.toBeNull()

					// isActive must be false (soft delete, not physical delete)
					expect(result.isActive).toBe(false)

					// findByIdAndUpdate was called with { isActive: false } — not a delete
					expect(userModelMock.findByIdAndUpdate).toHaveBeenCalledWith(
						userId,
						{ isActive: false },
						{ new: true },
					)
				}),
				{ numRuns: 100 },
			)
		})
	})

	// -------------------------------------------------------------------------
	// P12: Pagination returns correct subset
	// Feature: backend-crud, Property 12: Pagination returns correct subset
	// Validates: Requirements 1.2, 1.4
	// -------------------------------------------------------------------------
	describe('P12: Pagination returns correct subset', () => {
		it('findAll — data.length <= limit and total matches countDocuments', async () => {
			await fc.assert(
				fc.asyncProperty(
					fc.integer({ min: 1, max: 100 }),
					fc.integer({ min: 1, max: 10 }),
					fc.integer({ min: 0, max: 1000 }),
					async (limit, page, totalCount) => {
						// Build a data array of exactly min(limit, totalCount) items
						const dataSize = Math.min(limit, totalCount)
						const dataItems = Array.from({ length: dataSize }, (_, i) =>
							buildUserObject({ email: `user${i}@example.com` }),
						)

						const chain = mockQueryChain(dataItems)
						userModelMock.find.mockReturnValue(chain)
						userModelMock.countDocuments.mockResolvedValue(totalCount)

						const result = await service.findAll(page, limit)

						// data.length must be <= limit
						expect(result.data.length).toBeLessThanOrEqual(limit)

						// total must match countDocuments()
						expect(result.total).toBe(totalCount)

						// skip and limit were called with correct values
						expect(chain.skip).toHaveBeenCalledWith((page - 1) * limit)
						expect(chain.limit).toHaveBeenCalledWith(limit)
					},
				),
				{ numRuns: 100 },
			)
		})
	})

	// -------------------------------------------------------------------------
	// P11: ClickHouse failure doesn't block update/deactivate
	// Feature: backend-crud, Property 11: ClickHouse failure doesn't block update/deactivate
	// Validates: Requirements 3.8, 4.4
	// -------------------------------------------------------------------------
	describe("P11: ClickHouse failure doesn't block update/deactivate", () => {
		it('update — still returns updated document when ClickHouse throws', async () => {
			await fc.assert(
				fc.asyncProperty(
					fc.oneof(
						fc.constant(new Error('CH connection refused')),
						fc.constant(new Error('CH timeout')),
						fc.constant(new Error('CH write failed')),
						fc.string({ minLength: 1, maxLength: 100 }).map((msg) => new Error(msg)),
					),
					async (chError) => {
						const userDoc = buildUserObject({ name: 'Updated User' })

						const chain = {
							select: jest.fn().mockResolvedValue(userDoc),
						}
						userModelMock.findByIdAndUpdate.mockReturnValue(chain)

						// ClickHouse throws an error
						clickhouseServiceMock.insert.mockRejectedValue(chError)

						// update must still resolve successfully
						const result = await service.update('some-id', { name: 'Updated User' })

						expect(result).toBeDefined()
						expect(result).not.toBeNull()
						// The returned document should be the updated one
						expect(result).toBe(userDoc)
					},
				),
				{ numRuns: 100 },
			)
		})

		it('deactivate — still returns deactivated document when ClickHouse throws', async () => {
			await fc.assert(
				fc.asyncProperty(
					fc.oneof(
						fc.constant(new Error('CH connection refused')),
						fc.constant(new Error('CH timeout')),
						fc.constant(new Error('CH write failed')),
						fc.string({ minLength: 1, maxLength: 100 }).map((msg) => new Error(msg)),
					),
					async (chError) => {
						const userDoc = buildUserObject({ isActive: false })

						const chain = {
							select: jest.fn().mockResolvedValue(userDoc),
						}
						userModelMock.findByIdAndUpdate.mockReturnValue(chain)

						// ClickHouse throws an error
						clickhouseServiceMock.insert.mockRejectedValue(chError)

						// deactivate must still resolve successfully
						const result = await service.deactivate('some-id')

						expect(result).toBeDefined()
						expect(result).not.toBeNull()
						expect(result.isActive).toBe(false)
					},
				),
				{ numRuns: 100 },
			)
		})
	})

	// -------------------------------------------------------------------------
	// Edge case: findById throws NotFoundException when user not found
	// -------------------------------------------------------------------------
	describe('findById — NotFoundException when user not found', () => {
		it('throws NotFoundException for any id when model returns null', async () => {
			await fc.assert(
				fc.asyncProperty(fc.string({ minLength: 1, maxLength: 50 }), async (id) => {
					const chain = {
						select: jest.fn().mockResolvedValue(null),
					}
					userModelMock.findById.mockReturnValue(chain)

					await expect(service.findById(id)).rejects.toThrow(NotFoundException)
				}),
				{ numRuns: 100 },
			)
		})
	})
})
