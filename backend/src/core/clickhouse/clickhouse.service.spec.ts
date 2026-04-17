import { Test, TestingModule } from '@nestjs/testing'
import { ConfigService } from '@nestjs/config'
import { ClickhouseService } from './clickhouse.service'
import { createClient } from '@clickhouse/client'
import fc from 'fast-check'

// Mock the @clickhouse/client module
jest.mock('@clickhouse/client', () => ({
	createClient: jest.fn(),
}))

describe('ClickhouseService', () => {
	let service: ClickhouseService
	let mockClient: any

	beforeEach(async () => {
		// Create a mock client with all required methods
		mockClient = {
			query: jest.fn(),
			insert: jest.fn(),
			command: jest.fn(),
		}

		// Mock createClient to return our mock client
		;(createClient as jest.Mock).mockReturnValue(mockClient)

		const module: TestingModule = await Test.createTestingModule({
			providers: [
				ClickhouseService,
				{
					provide: ConfigService,
					useValue: {
						get: jest.fn((key: string, defaultValue?: string) => {
							const config: Record<string, string> = {
								CLICKHOUSE_HOST: 'localhost',
								CLICKHOUSE_PORT: '8123',
								CLICKHOUSE_DATABASE: 'test_db',
								CLICKHOUSE_USER: 'default',
								CLICKHOUSE_PASSWORD: '',
							}
							return config[key] ?? defaultValue
						}),
					},
				},
			],
		}).compile()

		service = module.get<ClickhouseService>(ClickhouseService)
	})

	afterEach(() => {
		jest.clearAllMocks()
	})

	describe('Property 2: ClickHouse init idempotence', () => {
		// Feature: backend-infrastructure, Property 2: ClickHouse init idempotence
		// Validates: Requirements 1.7
		it('should complete without error when onModuleInit is called N times', async () => {
			mockClient.command.mockResolvedValue(undefined)

			await fc.assert(
				fc.asyncProperty(fc.integer({ min: 2, max: 10 }), async (n) => {
					mockClient.command.mockClear()
					mockClient.command.mockResolvedValue(undefined)

					for (let i = 0; i < n; i++) {
						await expect(service.onModuleInit()).resolves.not.toThrow()
					}
				}),
				{ numRuns: 100 },
			)
		})
	})

	describe('Property 3: ClickHouse error propagation', () => {
		// Feature: backend-infrastructure, Property 3: ClickHouse error propagation
		// Validates: Requirements 1.9
		it('should wrap query errors with descriptive message and cause', async () => {
			await fc.assert(
				fc.asyncProperty(fc.string({ minLength: 1 }), async (errorMessage) => {
					const originalError = new Error(errorMessage)
					mockClient.query.mockRejectedValue(originalError)

					await expect(service.query('SELECT 1')).rejects.toMatchObject({
						message: expect.stringContaining('ClickHouse query failed'),
						cause: originalError,
					})
				}),
				{ numRuns: 100 },
			)
		})

		it('should wrap insert errors with descriptive message and cause', async () => {
			await fc.assert(
				fc.asyncProperty(fc.string({ minLength: 1 }), async (errorMessage) => {
					const originalError = new Error(errorMessage)
					mockClient.insert.mockRejectedValue(originalError)

					await expect(service.insert('users', [{ id: '1' }])).rejects.toMatchObject({
						message: expect.stringContaining('ClickHouse query failed'),
						cause: originalError,
					})
				}),
				{ numRuns: 100 },
			)
		})

		it('should handle non-Error thrown values and still wrap them', async () => {
			await fc.assert(
				fc.asyncProperty(fc.oneof(fc.string(), fc.integer(), fc.boolean()), async (thrownValue) => {
					mockClient.query.mockRejectedValue(thrownValue)

					await expect(service.query('SELECT 1')).rejects.toMatchObject({
						message: expect.stringContaining('ClickHouse query failed'),
						cause: thrownValue,
					})
				}),
				{ numRuns: 100 },
			)
		})
	})

	describe('Property 1: ClickHouse query params never interpolated', () => {
		// Feature: backend-infrastructure, Property 1: ClickHouse query params never interpolated
		it('should never interpolate parameter values into the raw SQL string', async () => {
			mockClient.query.mockResolvedValue({
				json: jest.fn().mockResolvedValue([]),
			})

			// Use UUIDs — they are unique enough to never appear in a static SQL template
			await fc.assert(
				fc.asyncProperty(fc.uuid(), fc.uuid(), fc.uuid(), async (email, name, phone) => {
					mockClient.query.mockClear()
					mockClient.query.mockResolvedValue({
						json: jest.fn().mockResolvedValue([]),
					})

					const queryString =
						'SELECT * FROM users WHERE email = {email:String} AND name = {name:String} AND phone = {phone:String}'
					const params = { email, name, phone }

					await service.query(queryString, params)

					expect(mockClient.query).toHaveBeenCalledTimes(1)

					const callArgs = mockClient.query.mock.calls[0][0]

					// Assert the raw query string does NOT contain any of the parameter values
					expect(callArgs.query).not.toContain(email)
					expect(callArgs.query).not.toContain(name)
					expect(callArgs.query).not.toContain(phone)

					// Assert that parameters were passed via query_params, not interpolated
					expect(callArgs.query_params).toEqual(params)
				}),
				{ numRuns: 100 },
			)
		})

		it('should pass parameters via query_params for all query types', async () => {
			mockClient.query.mockResolvedValue({
				json: jest.fn().mockResolvedValue([]),
			})

			// Use UUIDs as param values — they are guaranteed to never appear in a static SQL template
			await fc.assert(
				fc.asyncProperty(fc.uuid(), fc.uuid(), async (userId, orderId) => {
					mockClient.query.mockClear()
					mockClient.query.mockResolvedValue({
						json: jest.fn().mockResolvedValue([]),
					})

					const queryString =
						'SELECT * FROM orders WHERE userId = {userId:String} AND orderId = {orderId:String}'
					const params = { userId, orderId }

					await service.query(queryString, params)

					const callArgs = mockClient.query.mock.calls[0][0]

					// UUIDs cannot appear in a static SQL template — safe to assert absence
					expect(callArgs.query).not.toContain(userId)
					expect(callArgs.query).not.toContain(orderId)

					// Verify params are passed separately via query_params
					expect(callArgs.query_params).toEqual(params)
				}),
				{ numRuns: 100 },
			)
		})
	})
})
