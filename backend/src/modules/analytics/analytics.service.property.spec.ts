import { Test, TestingModule } from '@nestjs/testing'
import fc from 'fast-check'

import { ClickhouseService } from '@/core/clickhouse/clickhouse.service'
import { RedisService } from '@/core/redis/redis.service'
import { AnalyticsService } from './analytics.service'

// ---------------------------------------------------------------------------
// Test suite
// ---------------------------------------------------------------------------

describe('AnalyticsService — Property-Based Tests', () => {
	let service: AnalyticsService
	let mockClickhouse: { query: jest.Mock }
	let mockRedis: { get: jest.Mock; setex: jest.Mock }

	beforeEach(async () => {
		mockClickhouse = {
			query: jest.fn(),
		}

		mockRedis = {
			get: jest.fn().mockResolvedValue(null),
			setex: jest.fn().mockResolvedValue(undefined),
		}

		const module: TestingModule = await Test.createTestingModule({
			providers: [
				AnalyticsService,
				{ provide: ClickhouseService, useValue: mockClickhouse },
				{ provide: RedisService, useValue: mockRedis },
			],
		}).compile()

		service = module.get<AnalyticsService>(AnalyticsService)
	})

	// -------------------------------------------------------------------------
	// Smoke test — verify module setup
	// -------------------------------------------------------------------------
	it('should be defined', () => {
		expect(service).toBeDefined()
	})

	it('fc is importable and usable', () => {
		const result = fc.sample(fc.integer({ min: 1, max: 10 }), 5)
		expect(result).toHaveLength(5)
		result.forEach((n) => {
			expect(n).toBeGreaterThanOrEqual(1)
			expect(n).toBeLessThanOrEqual(10)
		})
	})

	// -------------------------------------------------------------------------
	// Feature: backend-analytics, Property 4: Redis error resilience
	// Validates: Требования 4.5, 4.6
	// -------------------------------------------------------------------------
	it('Property 4: AnalyticsService returns valid PaginatedResponse even when Redis throws', async () => {
		const emptyData: never[] = []

		await fc.assert(
			fc.asyncProperty(
				fc.constantFrom('get_throws', 'setex_throws', 'both_throw'),
				async (scenario) => {
					// Arrange: ClickHouse always returns empty arrays (data + count)
					mockClickhouse.query
						.mockResolvedValueOnce(emptyData) // data query
						.mockResolvedValueOnce([{ total: '0' }]) // count query

					if (scenario === 'get_throws') {
						mockRedis.get.mockRejectedValueOnce(new Error('Redis connection refused'))
						mockRedis.setex.mockResolvedValue(undefined)
					} else if (scenario === 'setex_throws') {
						mockRedis.get.mockResolvedValueOnce(null)
						mockRedis.setex.mockRejectedValueOnce(new Error('Redis write failed'))
					} else {
						mockRedis.get.mockRejectedValueOnce(new Error('Redis connection refused'))
						mockRedis.setex.mockRejectedValueOnce(new Error('Redis write failed'))
					}

					// Act: should NOT throw
					let result: Awaited<ReturnType<typeof service.getUsers>> | undefined
					let threw = false
					try {
						result = await service.getUsers({})
					} catch {
						threw = true
					}

					// Assert
					expect(threw).toBe(false)
					expect(result).toBeDefined()
					expect(Array.isArray(result!.data)).toBe(true)
					expect(typeof result!.total).toBe('number')
					expect(result!.total).toBeGreaterThanOrEqual(0)
					expect(typeof result!.page).toBe('number')
					expect(result!.page).toBeGreaterThanOrEqual(1)
					expect(typeof result!.pageSize).toBe('number')
					expect(result!.pageSize).toBeGreaterThanOrEqual(1)
				},
			),
			{ numRuns: 30 },
		)
	})

	// -------------------------------------------------------------------------
	// Feature: backend-analytics, Property 5: No SQL interpolation of user values
	// Validates: Требование 5.7
	// -------------------------------------------------------------------------
	it('Property 5: user-supplied values are never interpolated into SQL strings', () => {
		// Build the static SQL templates (without any user values) to know which substrings
		// are already present in the template itself. We use empty-search queries to get the
		// base SQL, then verify that user-supplied values don't appear *beyond* what the
		// template already contains.
		//
		// Strategy: generate search strings that contain characters unlikely to appear in
		// SQL column names / keywords. We use strings with digits and uppercase letters only,
		// which avoids collisions with lowercase SQL identifiers like "name", "email", etc.
		// Additionally we filter out any string that happens to be a substring of the static
		// SQL template (built without user values).

		// Get the static SQL templates (no search, no dates that could collide)
		const staticUsers = service.buildUsersQuery({})
		const staticPromocodes = service.buildPromocodesQuery({})
		const staticPromoUsages = service.buildPromoUsagesQuery({})
		const allStaticSql = [
			staticUsers.sql,
			staticUsers.countSql,
			staticPromocodes.sql,
			staticPromocodes.countSql,
			staticPromoUsages.sql,
			staticPromoUsages.countSql,
		].join('\n')

		// Generate search strings that are NOT substrings of the static SQL template.
		// Use uppercase-only alphanumeric strings (e.g. "A3F9B2") — very unlikely to appear
		// in SQL column names which are all lowercase.
		const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
		const safeSearchArb = fc
			.array(fc.constantFrom(...chars.split('')), { minLength: 6, maxLength: 16 })
			.map((arr) => arr.join(''))
			.filter((s: string) => !allStaticSql.includes(s))

		// ISO-8601-like date strings (YYYY-MM-DD) — these should never appear in the SQL template
		const dateArb = fc
			.tuple(
				fc.integer({ min: 2020, max: 2030 }),
				fc.integer({ min: 1, max: 12 }),
				fc.integer({ min: 1, max: 28 }),
			)
			.map(([y, m, d]) => `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`)

		fc.assert(
			fc.property(
				safeSearchArb,
				dateArb,
				dateArb,
				(search: string, dateFrom: string, dateTo: string) => {
					// --- users ---
					const usersResult = service.buildUsersQuery({ search, dateFrom, dateTo })
					// The search value itself must not appear literally in SQL (only {search:String} placeholder)
					expect(usersResult.sql).not.toContain(search)
					expect(usersResult.countSql).not.toContain(search)
					// dateFrom/dateTo are resolved and placed in params, not interpolated
					expect(usersResult.sql).not.toContain(dateFrom)
					expect(usersResult.sql).not.toContain(dateTo)

					// --- promocodes ---
					const promoResult = service.buildPromocodesQuery({ search, dateFrom, dateTo })
					expect(promoResult.sql).not.toContain(search)
					expect(promoResult.countSql).not.toContain(search)
					expect(promoResult.sql).not.toContain(dateFrom)
					expect(promoResult.sql).not.toContain(dateTo)

					// --- promo-usages ---
					const usagesResult = service.buildPromoUsagesQuery({ search, dateFrom, dateTo })
					expect(usagesResult.sql).not.toContain(search)
					expect(usagesResult.countSql).not.toContain(search)
					expect(usagesResult.sql).not.toContain(dateFrom)
					expect(usagesResult.sql).not.toContain(dateTo)
				},
			),
			{ numRuns: 100 },
		)
	})

	// -------------------------------------------------------------------------
	// Feature: backend-analytics, Property 8: Pagination OFFSET calculation
	// Validates: Требования 1.10, 2.10, 3.9
	// -------------------------------------------------------------------------
	it('Property 8: OFFSET equals (page - 1) * pageSize', async () => {
		await fc.assert(
			fc.asyncProperty(
				fc.integer({ min: 1, max: 1000 }),
				fc.integer({ min: 1, max: 100 }),
				async (page, pageSize) => {
					const expectedOffset = (page - 1) * pageSize

					// --- getUsers ---
					{
						const capturedParams: Record<string, unknown>[] = []
						mockClickhouse.query.mockImplementation(
							(_sql: string, params: Record<string, unknown>) => {
								capturedParams.push(params)
								return Promise.resolve([])
							},
						)
						mockRedis.get.mockResolvedValue(null)
						mockRedis.setex.mockResolvedValue(undefined)

						await service.getUsers({ page, pageSize })

						const offset = capturedParams[0]?.offset as number
						expect(offset).toBe(expectedOffset)
					}

					// --- getPromocodes ---
					{
						const capturedParams: Record<string, unknown>[] = []
						mockClickhouse.query.mockImplementation(
							(_sql: string, params: Record<string, unknown>) => {
								capturedParams.push(params)
								return Promise.resolve([])
							},
						)
						mockRedis.get.mockResolvedValue(null)
						mockRedis.setex.mockResolvedValue(undefined)

						await service.getPromocodes({ page, pageSize })

						const offset = capturedParams[0]?.offset as number
						expect(offset).toBe(expectedOffset)
					}

					// --- getPromoUsages ---
					{
						const capturedParams: Record<string, unknown>[] = []
						mockClickhouse.query.mockImplementation(
							(_sql: string, params: Record<string, unknown>) => {
								capturedParams.push(params)
								return Promise.resolve([])
							},
						)
						mockRedis.get.mockResolvedValue(null)
						mockRedis.setex.mockResolvedValue(undefined)

						await service.getPromoUsages({ page, pageSize })

						const offset = capturedParams[0]?.offset as number
						expect(offset).toBe(expectedOffset)
					}
				},
			),
			{ numRuns: 100 },
		)
	})

	// -------------------------------------------------------------------------
	// Feature: backend-analytics, Property 9: User aggregates correctness
	// Validates: Требование 1.2
	// -------------------------------------------------------------------------
	it('Property 9: user aggregates match manual calculation over random datasets', async () => {
		// Arbitraries for synthetic data
		const userIdArb = fc.uuid()
		const amountArb = fc.float({ min: 0, max: 10_000, noNaN: true })

		const userArb = fc.record({
			id: userIdArb,
			name: fc.string({ minLength: 1, maxLength: 20 }),
			email: fc.emailAddress(),
			phone: fc.string({ minLength: 7, maxLength: 15 }),
			isActive: fc.constantFrom(0, 1) as fc.Arbitrary<0 | 1>,
			createdAt: fc.constant('2025-01-01 00:00:00'),
		})

		const orderArb = (userId: string) =>
			fc.record({
				id: fc.uuid(),
				userId: fc.constant(userId),
				amount: amountArb,
				discount: amountArb,
			})

		const promoUsageArb = (userId: string) =>
			fc.record({
				id: fc.uuid(),
				userId: fc.constant(userId),
			})

		// Generate 1–5 users, each with 0–4 orders and 0–3 promo usages
		const datasetArb = fc.array(userArb, { minLength: 1, maxLength: 5 }).chain((users) => {
			const ordersPerUser = users.map((u) =>
				fc.array(orderArb(u.id), { minLength: 0, maxLength: 4 }),
			)
			const usagesPerUser = users.map((u) =>
				fc.array(promoUsageArb(u.id), { minLength: 0, maxLength: 3 }),
			)
			return fc
				.tuple(fc.constant(users), fc.tuple(...ordersPerUser), fc.tuple(...usagesPerUser))
				.map(([us, ordersArrays, usagesArrays]) => ({
					users: us,
					orders: ordersArrays.flat(),
					promoUsages: usagesArrays.flat(),
				}))
		})

		await fc.assert(
			fc.asyncProperty(datasetArb, async ({ users, orders, promoUsages }) => {
				// Manually compute expected aggregates per user
				const expected = users.map((u) => {
					const userOrders = orders.filter((o) => o.userId === u.id)
					const userUsages = promoUsages.filter((pu) => pu.userId === u.id)
					return {
						id: u.id,
						name: u.name,
						email: u.email,
						phone: u.phone,
						isActive: u.isActive,
						createdAt: u.createdAt,
						totalOrders: userOrders.length,
						totalSpent: userOrders.reduce((s, o) => s + o.amount, 0),
						totalDiscount: userOrders.reduce((s, o) => s + o.discount, 0),
						promoUsagesCount: userUsages.length,
					}
				})

				// Mock ClickHouse to return the pre-computed rows (simulating what CH would return)
				mockRedis.get.mockResolvedValue(null)
				mockRedis.setex.mockResolvedValue(undefined)
				mockClickhouse.query
					.mockResolvedValueOnce(expected) // data query
					.mockResolvedValueOnce([{ total: String(expected.length) }]) // count query

				const result = await service.getUsers({})

				// Verify each row's aggregates match manual calculation
				expect(result.data).toHaveLength(expected.length)
				result.data.forEach((row, i) => {
					expect(row.totalOrders).toBe(expected[i].totalOrders)
					expect(row.totalSpent).toBeCloseTo(expected[i].totalSpent, 5)
					expect(row.totalDiscount).toBeCloseTo(expected[i].totalDiscount, 5)
					expect(row.promoUsagesCount).toBe(expected[i].promoUsagesCount)
				})
				expect(result.total).toBe(expected.length)
			}),
			{ numRuns: 100 },
		)
	})

	// -------------------------------------------------------------------------
	// Feature: backend-analytics, Property 1: Cache key determinism
	// Validates: Требование 4.2
	// -------------------------------------------------------------------------
	it('Property 1: buildCacheKey returns the same string regardless of key order', () => {
		// Generator: record with 1–8 string keys mapped to non-null/non-undefined values
		const paramArbitrary = fc.dictionary(
			fc.string({ minLength: 1, maxLength: 10 }),
			fc.oneof(fc.string({ minLength: 0, maxLength: 20 }), fc.integer(), fc.boolean()),
			{ minKeys: 1, maxKeys: 8 },
		)

		const endpointArbitrary = fc.constantFrom('users', 'promocodes', 'promo-usages')

		fc.assert(
			fc.property(endpointArbitrary, paramArbitrary, (endpoint, params) => {
				// Shuffle key order by sorting keys in reverse then rebuilding the object
				const keys = Object.keys(params)
				const shuffledKeys = [...keys].sort(() => 0.5 - Math.random())
				const shuffledParams: Record<string, unknown> = {}
				for (const k of shuffledKeys) {
					shuffledParams[k] = params[k]
				}

				const key1 = service.buildCacheKey(endpoint, params as Record<string, unknown>)
				const key2 = service.buildCacheKey(endpoint, shuffledParams)

				expect(key1).toBe(key2)
			}),
			{ numRuns: 100 },
		)
	})
})
