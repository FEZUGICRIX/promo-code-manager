import { ConflictException } from '@nestjs/common'
import { getModelToken } from '@nestjs/mongoose'
import { Test, TestingModule } from '@nestjs/testing'
import { validate } from 'class-validator'
import fc from 'fast-check'

import { ClickhouseService } from '@/core/clickhouse/clickhouse.service'
import { CreatePromocodeDTO } from './dto/create-promocode.dto'
import { Promocode, PromocodeDocument } from './schemas/promocode.schema'
import { PromocodesService } from './promocodes.service'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Build a minimal PromocodeDocument-like mock */
function buildPromoDoc(overrides: Record<string, unknown> = {}): PromocodeDocument {
	const base = {
		_id: { toString: () => 'promo-id-123' },
		code: 'SUMMER20',
		discount: 20,
		totalLimit: 100,
		userLimit: 1,
		dateFrom: null,
		dateTo: null,
		isActive: true,
		createdAt: new Date(),
		updatedAt: new Date(),
		set: jest.fn().mockImplementation(function (
			this: Record<string, unknown>,
			patch: Record<string, unknown>,
		) {
			Object.assign(this, patch)
		}),
		save: jest.fn().mockResolvedValue(undefined),
		toObject: function () {
			return { ...this }
		},
		...overrides,
	}
	return base as unknown as PromocodeDocument
}

// ---------------------------------------------------------------------------
// Test suite
// ---------------------------------------------------------------------------

describe('PromocodesService — Property-Based Tests', () => {
	let service: PromocodesService
	let promocodeModelMock: Record<string, jest.Mock>
	let clickhouseServiceMock: { insert: jest.Mock }

	beforeEach(async () => {
		promocodeModelMock = {
			create: jest.fn(),
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
				PromocodesService,
				{
					provide: getModelToken(Promocode.name),
					useValue: promocodeModelMock,
				},
				{
					provide: ClickhouseService,
					useValue: clickhouseServiceMock,
				},
			],
		}).compile()

		service = module.get<PromocodesService>(PromocodesService)
	})

	// -------------------------------------------------------------------------
	// P3: Duplicate code → 409
	// Feature: backend-crud, Property 3: Duplicate code → 409
	// Validates: Requirements 5.9
	// -------------------------------------------------------------------------
	describe('P3: Duplicate code → 409', () => {
		it('create — throws ConflictException when MongoError code 11000 is thrown', async () => {
			await fc.assert(
				fc.asyncProperty(fc.string({ minLength: 1, maxLength: 50 }), async (code) => {
					const mongoError = Object.assign(new Error('duplicate key error'), { code: 11000 })

					// Model.create throws a duplicate key error
					promocodeModelMock.create.mockRejectedValue(mongoError)

					await expect(
						service.create({
							code,
							discount: 20,
							totalLimit: 100,
							userLimit: 1,
						}),
					).rejects.toThrow(ConflictException)

					// Reset for next iteration
					promocodeModelMock.create.mockReset()
				}),
				{ numRuns: 100 },
			)
		})
	})

	// -------------------------------------------------------------------------
	// P4: Invalid DTO → 400
	// Feature: backend-crud, Property 4: Invalid DTO → 400
	// Validates: Requirements 5.2, 5.3, 5.4, 5.5, 14.2
	// -------------------------------------------------------------------------
	describe('P4: Invalid DTO → 400', () => {
		it('CreatePromocodeDTO — discount out of range produces validation errors', async () => {
			await fc.assert(
				fc.asyncProperty(
					// discount < 1 or > 100
					fc.oneof(fc.integer({ min: -1000, max: 0 }), fc.integer({ min: 101, max: 1000 })),
					async (invalidDiscount) => {
						const dto = Object.assign(new CreatePromocodeDTO(), {
							code: 'VALID',
							discount: invalidDiscount,
							totalLimit: 10,
							userLimit: 1,
						})

						const errors = await validate(dto)
						expect(errors.length).toBeGreaterThan(0)
					},
				),
				{ numRuns: 100 },
			)
		})

		it('CreatePromocodeDTO — totalLimit < 1 produces validation errors', async () => {
			await fc.assert(
				fc.asyncProperty(fc.integer({ min: -1000, max: 0 }), async (invalidTotalLimit) => {
					const dto = Object.assign(new CreatePromocodeDTO(), {
						code: 'VALID',
						discount: 20,
						totalLimit: invalidTotalLimit,
						userLimit: 1,
					})

					const errors = await validate(dto)
					expect(errors.length).toBeGreaterThan(0)
				}),
				{ numRuns: 100 },
			)
		})

		it('CreatePromocodeDTO — userLimit < 1 produces validation errors', async () => {
			await fc.assert(
				fc.asyncProperty(fc.integer({ min: -1000, max: 0 }), async (invalidUserLimit) => {
					const dto = Object.assign(new CreatePromocodeDTO(), {
						code: 'VALID',
						discount: 20,
						totalLimit: 10,
						userLimit: invalidUserLimit,
					})

					const errors = await validate(dto)
					expect(errors.length).toBeGreaterThan(0)
				}),
				{ numRuns: 100 },
			)
		})

		it('CreatePromocodeDTO — empty code produces validation errors', async () => {
			await fc.assert(
				fc.asyncProperty(fc.constant(''), async (emptyCode) => {
					const dto = Object.assign(new CreatePromocodeDTO(), {
						code: emptyCode,
						discount: 20,
						totalLimit: 10,
						userLimit: 1,
					})

					const errors = await validate(dto)
					expect(errors.length).toBeGreaterThan(0)
				}),
				{ numRuns: 100 },
			)
		})
	})

	// -------------------------------------------------------------------------
	// P10: CH sync called on create/update/deactivate
	// Feature: backend-crud, Property 10: CH sync called on create/update/deactivate
	// Validates: Requirements 5.10, 8.10, 9.3
	// -------------------------------------------------------------------------
	describe('P10: CH sync called on create/update/deactivate', () => {
		it('create — clickhouseService.insert is called with promocode data', async () => {
			await fc.assert(
				fc.asyncProperty(
					fc.record({
						code: fc.string({ minLength: 1, maxLength: 30 }).filter((s) => s.trim().length > 0),
						discount: fc.integer({ min: 1, max: 100 }),
						totalLimit: fc.integer({ min: 1, max: 1000 }),
						userLimit: fc.integer({ min: 1, max: 100 }),
					}),
					async (dtoFields) => {
						const promoDoc = buildPromoDoc(dtoFields)
						promocodeModelMock.create.mockResolvedValue(promoDoc)
						clickhouseServiceMock.insert.mockResolvedValue(undefined)

						await service.create(dtoFields)

						// Allow fire-and-forget to settle
						await new Promise((r) => setTimeout(r, 10))

						expect(clickhouseServiceMock.insert).toHaveBeenCalledWith(
							'promocodes',
							expect.arrayContaining([
								expect.objectContaining({
									id: promoDoc._id.toString(),
									code: promoDoc.code,
									discount: promoDoc.discount,
								}),
							]),
						)

						// Reset for next iteration
						promocodeModelMock.create.mockReset()
						clickhouseServiceMock.insert.mockReset()
						clickhouseServiceMock.insert.mockResolvedValue(undefined)
					},
				),
				{ numRuns: 100 },
			)
		})

		it('update — clickhouseService.insert is called with updated promocode data', async () => {
			await fc.assert(
				fc.asyncProperty(
					fc.record({
						discount: fc.integer({ min: 1, max: 100 }),
					}),
					async (updateFields) => {
						const promoDoc = buildPromoDoc({ discount: updateFields.discount })
						promocodeModelMock.findById.mockResolvedValue(promoDoc)
						clickhouseServiceMock.insert.mockResolvedValue(undefined)

						await service.update('promo-id-123', updateFields)

						// Allow fire-and-forget to settle
						await new Promise((r) => setTimeout(r, 10))

						expect(clickhouseServiceMock.insert).toHaveBeenCalledWith(
							'promocodes',
							expect.arrayContaining([
								expect.objectContaining({
									id: promoDoc._id.toString(),
								}),
							]),
						)

						// Reset for next iteration
						promocodeModelMock.findById.mockReset()
						clickhouseServiceMock.insert.mockReset()
						clickhouseServiceMock.insert.mockResolvedValue(undefined)
					},
				),
				{ numRuns: 100 },
			)
		})

		it('deactivate — clickhouseService.insert is called with isActive: 0', async () => {
			await fc.assert(
				fc.asyncProperty(
					fc.string({ minLength: 1, maxLength: 30 }).filter((s) => s.trim().length > 0),
					async (promoId) => {
						const promoDoc = buildPromoDoc({ isActive: false })
						promocodeModelMock.findById.mockResolvedValue(promoDoc)
						clickhouseServiceMock.insert.mockResolvedValue(undefined)

						await service.deactivate(promoId)

						// Allow fire-and-forget to settle
						await new Promise((r) => setTimeout(r, 10))

						expect(clickhouseServiceMock.insert).toHaveBeenCalledWith(
							'promocodes',
							expect.arrayContaining([
								expect.objectContaining({
									id: promoDoc._id.toString(),
									isActive: 0,
								}),
							]),
						)

						// Reset for next iteration
						promocodeModelMock.findById.mockReset()
						clickhouseServiceMock.insert.mockReset()
						clickhouseServiceMock.insert.mockResolvedValue(undefined)
					},
				),
				{ numRuns: 100 },
			)
		})
	})
})
