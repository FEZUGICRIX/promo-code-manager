import { ConflictException, ForbiddenException, UnprocessableEntityException } from '@nestjs/common'
import { getModelToken } from '@nestjs/mongoose'
import { Test, TestingModule } from '@nestjs/testing'
import fc from 'fast-check'
import { Types } from 'mongoose'

import { ClickhouseService } from '@/core/clickhouse/clickhouse.service'
import { RedisService } from '@/core/redis/redis.service'
import { User, UserDocument } from '../auth/schemas/user.schema'
import { Promocode, PromocodeDocument } from '../promocodes/schemas/promocode.schema'
import { CreateOrderDTO } from './dto/create-order.dto'
import { Order, OrderDocument } from './schemas/order.schema'
import { PromoUsage, PromoUsageDocument } from './schemas/promo-usage.schema'
import { OrdersService } from './orders.service'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeObjectId(): Types.ObjectId {
	return new Types.ObjectId()
}

function buildOrderDoc(overrides: Record<string, unknown> = {}): OrderDocument {
	const id = makeObjectId()
	const userId = makeObjectId()
	return {
		_id: id,
		userId,
		amount: 1000,
		discount: 0,
		finalAmount: 1000,
		promocodeId: undefined,
		createdAt: new Date(),
		updatedAt: new Date(),
		toObject: function () {
			return { ...this }
		},
		...overrides,
	} as unknown as OrderDocument
}

function buildPromoDoc(overrides: Record<string, unknown> = {}): PromocodeDocument {
	const id = makeObjectId()
	return {
		_id: id,
		code: 'PROMO10',
		discount: 10,
		totalLimit: 100,
		userLimit: 5,
		dateFrom: null,
		dateTo: null,
		isActive: true,
		createdAt: new Date(),
		updatedAt: new Date(),
		toObject: function () {
			return { ...this }
		},
		...overrides,
	} as unknown as PromocodeDocument
}

function buildUserDoc(overrides: Record<string, unknown> = {}): UserDocument {
	const id = makeObjectId()
	return {
		_id: id,
		email: 'user@example.com',
		name: 'Test User',
		phone: '+79001234567',
		isActive: true,
		createdAt: new Date(),
		updatedAt: new Date(),
		toObject: function () {
			return { ...this }
		},
		...overrides,
	} as unknown as UserDocument
}

function buildPromoUsageDoc(overrides: Record<string, unknown> = {}): PromoUsageDocument {
	const id = makeObjectId()
	return {
		_id: id,
		promocodeId: makeObjectId(),
		promocodeCode: 'PROMO10',
		promocodeDiscount: 10,
		userId: makeObjectId(),
		userName: 'Test User',
		userEmail: 'user@example.com',
		orderId: makeObjectId(),
		orderAmount: 1000,
		discountAmount: 100,
		createdAt: new Date(),
		toObject: function () {
			return { ...this }
		},
		...overrides,
	} as unknown as PromoUsageDocument
}

// ---------------------------------------------------------------------------
// Test suite
// ---------------------------------------------------------------------------

describe('OrdersService — Property-Based Tests', () => {
	let service: OrdersService
	let orderModelMock: Record<string, jest.Mock>
	let promoUsageModelMock: Record<string, jest.Mock>
	let userModelMock: Record<string, jest.Mock>
	let promocodeModelMock: Record<string, jest.Mock>
	let clickhouseServiceMock: { insert: jest.Mock }
	let redisServiceMock: { acquireLock: jest.Mock; releaseLock: jest.Mock }

	beforeEach(async () => {
		orderModelMock = {
			create: jest.fn(),
			find: jest.fn(),
			findById: jest.fn(),
			findByIdAndUpdate: jest.fn(),
		}

		promoUsageModelMock = {
			create: jest.fn(),
			exists: jest.fn(),
			countDocuments: jest.fn(),
		}

		userModelMock = {
			findById: jest.fn(),
		}

		promocodeModelMock = {
			findOne: jest.fn(),
		}

		clickhouseServiceMock = {
			insert: jest.fn().mockResolvedValue(undefined),
		}

		redisServiceMock = {
			acquireLock: jest.fn().mockResolvedValue(true),
			releaseLock: jest.fn().mockResolvedValue(undefined),
		}

		const module: TestingModule = await Test.createTestingModule({
			providers: [
				OrdersService,
				{ provide: getModelToken(Order.name), useValue: orderModelMock },
				{ provide: getModelToken(User.name), useValue: userModelMock },
				{ provide: getModelToken(PromoUsage.name), useValue: promoUsageModelMock },
				{ provide: getModelToken(Promocode.name), useValue: promocodeModelMock },
				{ provide: ClickhouseService, useValue: clickhouseServiceMock },
				{ provide: RedisService, useValue: redisServiceMock },
			],
		}).compile()

		service = module.get<OrdersService>(OrdersService)
	})

	// -------------------------------------------------------------------------
	// P5: Wrong user → 403
	// Feature: backend-crud, Property 5: Wrong user → 403
	// Validates: Requirements 12.4
	// -------------------------------------------------------------------------
	describe('P5: Wrong user → 403', () => {
		it('applyPromocode — throws ForbiddenException when order belongs to different user', async () => {
			await fc.assert(
				fc.asyncProperty(
					fc.string({ minLength: 1, maxLength: 30 }),
					fc.string({ minLength: 1, maxLength: 30 }),
					async (ownerSuffix, requesterSuffix) => {
						// Ensure owner and requester are different
						const ownerId = new Types.ObjectId().toString() + ownerSuffix
						const requesterId = new Types.ObjectId().toString() + requesterSuffix

						// Build order owned by ownerId
						const orderDoc = buildOrderDoc({
							userId: { toString: () => ownerId },
						})

						orderModelMock.findById.mockResolvedValue(orderDoc)

						// requesterId is always different from ownerId (different ObjectId base)
						await expect(
							service.applyPromocode(
								makeObjectId().toString(),
								{ promocodeCode: 'PROMO10' },
								requesterId,
							),
						).rejects.toThrow(ForbiddenException)

						orderModelMock.findById.mockReset()
					},
				),
				{ numRuns: 100 },
			)
		})
	})

	// -------------------------------------------------------------------------
	// P6: Limit enforcement totalLimit/userLimit
	// Feature: backend-crud, Property 6: Limit enforcement totalLimit/userLimit
	// Validates: Requirements 12.7, 12.8
	// -------------------------------------------------------------------------
	describe('P6: Limit enforcement totalLimit/userLimit', () => {
		it('applyPromocode — throws UnprocessableEntityException when totalLimit reached', async () => {
			await fc.assert(
				fc.asyncProperty(fc.integer({ min: 1, max: 50 }), async (limit) => {
					const userId = makeObjectId().toString()
					const orderDoc = buildOrderDoc({
						userId: { toString: () => userId },
					})
					const promoDoc = buildPromoDoc({ totalLimit: limit, userLimit: limit + 10 })

					orderModelMock.findById.mockResolvedValue(orderDoc)
					promocodeModelMock.findOne.mockResolvedValue(promoDoc)
					promoUsageModelMock.exists.mockResolvedValue(null)
					// countDocuments returns >= totalLimit
					promoUsageModelMock.countDocuments.mockResolvedValue(limit)

					await expect(
						service.applyPromocode(makeObjectId().toString(), { promocodeCode: 'PROMO10' }, userId),
					).rejects.toThrow(UnprocessableEntityException)

					orderModelMock.findById.mockReset()
					promocodeModelMock.findOne.mockReset()
					promoUsageModelMock.exists.mockReset()
					promoUsageModelMock.countDocuments.mockReset()
				}),
				{ numRuns: 100 },
			)
		})

		it('applyPromocode — throws UnprocessableEntityException when userLimit reached', async () => {
			await fc.assert(
				fc.asyncProperty(fc.integer({ min: 1, max: 50 }), async (limit) => {
					const userId = makeObjectId().toString()
					const orderDoc = buildOrderDoc({
						userId: { toString: () => userId },
					})
					const promoDoc = buildPromoDoc({ totalLimit: limit + 100, userLimit: limit })

					orderModelMock.findById.mockResolvedValue(orderDoc)
					promocodeModelMock.findOne.mockResolvedValue(promoDoc)
					promoUsageModelMock.exists.mockResolvedValue(null)
					// First call (totalUsed) returns 0 (under totalLimit)
					// Second call (userUsed) returns >= userLimit
					promoUsageModelMock.countDocuments.mockResolvedValueOnce(0).mockResolvedValueOnce(limit)

					await expect(
						service.applyPromocode(makeObjectId().toString(), { promocodeCode: 'PROMO10' }, userId),
					).rejects.toThrow(UnprocessableEntityException)

					orderModelMock.findById.mockReset()
					promocodeModelMock.findOne.mockReset()
					promoUsageModelMock.exists.mockReset()
					promoUsageModelMock.countDocuments.mockReset()
				}),
				{ numRuns: 100 },
			)
		})
	})

	// -------------------------------------------------------------------------
	// P7: Duplicate apply → 409
	// Feature: backend-crud, Property 7: Duplicate apply → 409
	// Validates: Requirements 12.6
	// -------------------------------------------------------------------------
	describe('P7: Duplicate apply → 409', () => {
		it('applyPromocode — throws ConflictException when promocode already applied to order', async () => {
			await fc.assert(
				fc.asyncProperty(fc.string({ minLength: 1, maxLength: 30 }), async (promocodeCode) => {
					const userId = makeObjectId().toString()
					const orderId = makeObjectId().toString()
					const orderDoc = buildOrderDoc({
						userId: { toString: () => userId },
					})
					const promoDoc = buildPromoDoc({ code: promocodeCode })

					orderModelMock.findById.mockResolvedValue(orderDoc)
					promocodeModelMock.findOne.mockResolvedValue(promoDoc)
					// PromoUsage.exists returns truthy → already applied
					promoUsageModelMock.exists.mockResolvedValue({ _id: makeObjectId() })

					await expect(service.applyPromocode(orderId, { promocodeCode }, userId)).rejects.toThrow(
						ConflictException,
					)

					// Verify the correct message
					await expect(service.applyPromocode(orderId, { promocodeCode }, userId)).rejects.toThrow(
						'Promocode already applied to this order',
					)

					orderModelMock.findById.mockReset()
					promocodeModelMock.findOne.mockReset()
					promoUsageModelMock.exists.mockReset()
				}),
				{ numRuns: 100 },
			)
		})
	})

	// -------------------------------------------------------------------------
	// P8: Lock busy → 409, no MongoDB changes
	// Feature: backend-crud, Property 8: Lock busy → 409, no MongoDB changes
	// Validates: Requirements 12.11, 12.12
	// -------------------------------------------------------------------------
	describe('P8: Lock busy → 409, no MongoDB changes', () => {
		it('applyPromocode — throws ConflictException and does not call findByIdAndUpdate when lock is busy', async () => {
			await fc.assert(
				fc.asyncProperty(
					fc.record({
						code: fc.string({ minLength: 1, maxLength: 30 }).filter((s) => s.trim().length > 0),
						discount: fc.integer({ min: 1, max: 100 }),
						totalLimit: fc.integer({ min: 10, max: 100 }),
						userLimit: fc.integer({ min: 5, max: 50 }),
					}),
					async (promoFields) => {
						const userId = makeObjectId().toString()
						const orderId = makeObjectId().toString()
						const orderDoc = buildOrderDoc({
							userId: { toString: () => userId },
						})
						const promoDoc = buildPromoDoc(promoFields)

						orderModelMock.findById.mockResolvedValue(orderDoc)
						promocodeModelMock.findOne.mockResolvedValue(promoDoc)
						promoUsageModelMock.exists.mockResolvedValue(null)
						promoUsageModelMock.countDocuments.mockResolvedValue(0)
						// Lock is busy
						redisServiceMock.acquireLock.mockResolvedValue(false)

						await expect(
							service.applyPromocode(orderId, { promocodeCode: promoFields.code }, userId),
						).rejects.toThrow(ConflictException)

						await expect(
							service.applyPromocode(orderId, { promocodeCode: promoFields.code }, userId),
						).rejects.toThrow('Promocode is being processed, please retry')

						// findByIdAndUpdate must NOT have been called
						expect(orderModelMock.findByIdAndUpdate).not.toHaveBeenCalled()

						orderModelMock.findById.mockReset()
						promocodeModelMock.findOne.mockReset()
						promoUsageModelMock.exists.mockReset()
						promoUsageModelMock.countDocuments.mockReset()
						redisServiceMock.acquireLock.mockReset()
						orderModelMock.findByIdAndUpdate.mockReset()
					},
				),
				{ numRuns: 100 },
			)
		})
	})

	// -------------------------------------------------------------------------
	// P9: Discount calculation correctness
	// Feature: backend-crud, Property 9: Discount calculation correctness
	// Validates: Requirements 12.13
	// -------------------------------------------------------------------------
	describe('P9: Discount calculation correctness', () => {
		it('applyPromocode — discountAmount and finalAmount are calculated correctly', async () => {
			await fc.assert(
				fc.asyncProperty(
					fc.float({ min: Math.fround(0.01), max: Math.fround(1_000_000), noNaN: true }),
					fc.integer({ min: 1, max: 100 }),
					async (amount, discount) => {
						const userId = makeObjectId().toString()
						const orderId = makeObjectId().toString()
						const orderDoc = buildOrderDoc({
							amount,
							userId: { toString: () => userId },
						})
						const promoDoc = buildPromoDoc({ discount })
						const userDoc = buildUserDoc()

						const expectedDiscountAmount = (amount * discount) / 100
						const expectedFinalAmount = amount - expectedDiscountAmount

						orderModelMock.findById
							.mockResolvedValueOnce(orderDoc) // initial findById
							.mockResolvedValueOnce({
								// findById after update
								...orderDoc,
								discount,
								discountAmount: expectedDiscountAmount,
								finalAmount: expectedFinalAmount,
								promocodeId: promoDoc._id,
								toObject: function () {
									return { ...this }
								},
							})
						promocodeModelMock.findOne.mockResolvedValue(promoDoc)
						promoUsageModelMock.exists.mockResolvedValue(null)
						promoUsageModelMock.countDocuments.mockResolvedValue(0)
						redisServiceMock.acquireLock.mockResolvedValue(true)
						userModelMock.findById.mockResolvedValue(userDoc)
						promoUsageModelMock.create.mockResolvedValue(
							buildPromoUsageDoc({
								discountAmount: expectedDiscountAmount,
							}),
						)
						orderModelMock.findByIdAndUpdate.mockResolvedValue(undefined)

						const result = await service.applyPromocode(
							orderId,
							{ promocodeCode: 'PROMO10' },
							userId,
						)

						const resultAny = result as unknown as Record<string, number>
						expect(resultAny['discountAmount']).toBeCloseTo(expectedDiscountAmount, 5)
						expect(result.finalAmount).toBeCloseTo(expectedFinalAmount, 5)

						// Reset mocks
						orderModelMock.findById.mockReset()
						promocodeModelMock.findOne.mockReset()
						promoUsageModelMock.exists.mockReset()
						promoUsageModelMock.countDocuments.mockReset()
						redisServiceMock.acquireLock.mockReset()
						userModelMock.findById.mockReset()
						promoUsageModelMock.create.mockReset()
						orderModelMock.findByIdAndUpdate.mockReset()
					},
				),
				{ numRuns: 100 },
			)
		})
	})

	// -------------------------------------------------------------------------
	// P10: CH sync on POST /orders and apply-promocode
	// Feature: backend-crud, Property 10: CH sync on POST /orders and apply-promocode
	// Validates: Requirements 10.4, 12.17
	// -------------------------------------------------------------------------
	describe('P10: CH sync on POST /orders and apply-promocode', () => {
		it('create — clickhouseService.insert is called with order data including userName and userEmail', async () => {
			await fc.assert(
				fc.asyncProperty(
					fc.record({
						amount: fc.float({ min: Math.fround(0.01), max: Math.fround(1_000_000), noNaN: true }),
						name: fc.string({ minLength: 2, maxLength: 50 }),
						email: fc.emailAddress(),
					}),
					async ({ amount, name, email }) => {
						const userId = makeObjectId().toString()
						const userObjectId = new Types.ObjectId(userId)
						const orderDoc = buildOrderDoc({ amount, finalAmount: amount, userId: userObjectId })
						const userDoc = buildUserDoc({ name, email })

						// Reset mocks at start of each iteration
						orderModelMock.create.mockReset()
						userModelMock.findById.mockReset()
						clickhouseServiceMock.insert.mockReset()
						clickhouseServiceMock.insert.mockResolvedValue(undefined)

						orderModelMock.create.mockResolvedValue(orderDoc)
						userModelMock.findById.mockReturnValue({
							select: jest.fn().mockResolvedValue(userDoc),
						})

						const dto: CreateOrderDTO = { amount }
						await service.create(dto, userId)

						// Allow fire-and-forget to settle
						await new Promise((r) => setTimeout(r, 20))

						expect(clickhouseServiceMock.insert).toHaveBeenCalledWith(
							'orders',
							expect.arrayContaining([
								expect.objectContaining({
									id: orderDoc._id.toString(),
									userId,
									userName: name,
									userEmail: email,
									amount,
								}),
							]),
						)
					},
				),
				{ numRuns: 100 },
			)
		})

		it('applyPromocode — clickhouseService.insert is called after successful apply', async () => {
			await fc.assert(
				fc.asyncProperty(
					fc.record({
						amount: fc.float({ min: Math.fround(1), max: Math.fround(10000), noNaN: true }),
						discount: fc.integer({ min: 1, max: 100 }),
					}),
					async ({ amount, discount }) => {
						const userId = makeObjectId().toString()
						const orderId = makeObjectId().toString()
						const orderDoc = buildOrderDoc({
							amount,
							userId: { toString: () => userId },
						})
						const promoDoc = buildPromoDoc({ discount })
						const userDoc = buildUserDoc()
						const discountAmount = (amount * discount) / 100
						const finalAmount = amount - discountAmount
						const updatedOrder = {
							...orderDoc,
							discount,
							discountAmount,
							finalAmount,
							toObject: function () {
								return { ...this }
							},
						}

						orderModelMock.findById
							.mockResolvedValueOnce(orderDoc)
							.mockResolvedValueOnce(updatedOrder)
						promocodeModelMock.findOne.mockResolvedValue(promoDoc)
						promoUsageModelMock.exists.mockResolvedValue(null)
						promoUsageModelMock.countDocuments.mockResolvedValue(0)
						redisServiceMock.acquireLock.mockResolvedValue(true)
						userModelMock.findById.mockResolvedValue(userDoc)
						promoUsageModelMock.create.mockResolvedValue(buildPromoUsageDoc({ discountAmount }))
						orderModelMock.findByIdAndUpdate.mockResolvedValue(undefined)
						clickhouseServiceMock.insert.mockResolvedValue(undefined)

						await service.applyPromocode(orderId, { promocodeCode: 'PROMO10' }, userId)

						// Allow fire-and-forget to settle
						await new Promise((r) => setTimeout(r, 20))

						expect(clickhouseServiceMock.insert).toHaveBeenCalledWith(
							'promo_usages',
							expect.any(Array),
						)

						orderModelMock.findById.mockReset()
						promocodeModelMock.findOne.mockReset()
						promoUsageModelMock.exists.mockReset()
						promoUsageModelMock.countDocuments.mockReset()
						redisServiceMock.acquireLock.mockReset()
						userModelMock.findById.mockReset()
						promoUsageModelMock.create.mockReset()
						orderModelMock.findByIdAndUpdate.mockReset()
						clickhouseServiceMock.insert.mockReset()
						clickhouseServiceMock.insert.mockResolvedValue(undefined)
					},
				),
				{ numRuns: 100 },
			)
		})
	})

	// -------------------------------------------------------------------------
	// P11: CH failure doesn't block orders
	// Feature: backend-crud, Property 11: CH failure doesn't block orders
	// Validates: Requirements 10.5, 12.18
	// -------------------------------------------------------------------------
	describe("P11: CH failure doesn't block orders", () => {
		it('create — still returns order document when ClickHouse throws', async () => {
			await fc.assert(
				fc.asyncProperty(
					fc.oneof(
						fc.constant(new Error('CH connection refused')),
						fc.constant(new Error('CH timeout')),
						fc.string({ minLength: 1, maxLength: 100 }).map((msg) => new Error(msg)),
					),
					async (chError) => {
						const userId = makeObjectId().toString()
						const orderDoc = buildOrderDoc()
						const userDoc = buildUserDoc()

						orderModelMock.create.mockResolvedValue(orderDoc)
						userModelMock.findById.mockReturnValue({
							select: jest.fn().mockResolvedValue(userDoc),
						})
						clickhouseServiceMock.insert.mockRejectedValue(chError)

						const result = await service.create({ amount: 1000 }, userId)

						expect(result).toBeDefined()
						expect(result).not.toBeNull()
						expect(result).toBe(orderDoc)

						orderModelMock.create.mockReset()
						userModelMock.findById.mockReset()
						clickhouseServiceMock.insert.mockReset()
					},
				),
				{ numRuns: 100 },
			)
		})

		it('applyPromocode — still returns updated order when ClickHouse throws', async () => {
			await fc.assert(
				fc.asyncProperty(
					fc.oneof(
						fc.constant(new Error('CH connection refused')),
						fc.constant(new Error('CH timeout')),
						fc.string({ minLength: 1, maxLength: 100 }).map((msg) => new Error(msg)),
					),
					async (chError) => {
						const userId = makeObjectId().toString()
						const orderId = makeObjectId().toString()
						const orderDoc = buildOrderDoc({
							userId: { toString: () => userId },
						})
						const promoDoc = buildPromoDoc()
						const userDoc = buildUserDoc()
						const updatedOrder = {
							...orderDoc,
							discount: 10,
							discountAmount: 100,
							finalAmount: 900,
							toObject: function () {
								return { ...this }
							},
						}

						orderModelMock.findById
							.mockResolvedValueOnce(orderDoc)
							.mockResolvedValueOnce(updatedOrder)
						promocodeModelMock.findOne.mockResolvedValue(promoDoc)
						promoUsageModelMock.exists.mockResolvedValue(null)
						promoUsageModelMock.countDocuments.mockResolvedValue(0)
						redisServiceMock.acquireLock.mockResolvedValue(true)
						userModelMock.findById.mockResolvedValue(userDoc)
						promoUsageModelMock.create.mockResolvedValue(buildPromoUsageDoc())
						orderModelMock.findByIdAndUpdate.mockResolvedValue(undefined)
						clickhouseServiceMock.insert.mockRejectedValue(chError)

						const result = await service.applyPromocode(
							orderId,
							{ promocodeCode: 'PROMO10' },
							userId,
						)

						expect(result).toBeDefined()
						expect(result).not.toBeNull()

						orderModelMock.findById.mockReset()
						promocodeModelMock.findOne.mockReset()
						promoUsageModelMock.exists.mockReset()
						promoUsageModelMock.countDocuments.mockReset()
						redisServiceMock.acquireLock.mockReset()
						userModelMock.findById.mockReset()
						promoUsageModelMock.create.mockReset()
						orderModelMock.findByIdAndUpdate.mockReset()
						clickhouseServiceMock.insert.mockReset()
					},
				),
				{ numRuns: 100 },
			)
		})
	})
})
