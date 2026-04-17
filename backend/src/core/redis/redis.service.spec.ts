// Feature: backend-infrastructure, Property 4: Redis CRUD round-trip
import { Test, TestingModule } from '@nestjs/testing'
import { ConfigService } from '@nestjs/config'
import { RedisService } from './redis.service'
import { createClient } from 'redis'
import fc from 'fast-check'

jest.mock('redis', () => ({
	createClient: jest.fn(),
}))

describe('RedisService', () => {
	let service: RedisService
	let store: Map<string, string>

	beforeEach(async () => {
		store = new Map<string, string>()

		const mockClient = {
			on: jest.fn(),
			connect: jest.fn().mockResolvedValue(undefined),
			quit: jest.fn().mockResolvedValue(undefined),
			get: jest.fn((key: string) => Promise.resolve(store.get(key) ?? null)),
			set: jest.fn((key: string, value: string, options?: unknown) => {
				if (options && typeof options === 'object' && (options as Record<string, unknown>).NX) {
					if (store.has(key)) {
						return Promise.resolve(null)
					}
				}
				store.set(key, value)
				return Promise.resolve('OK')
			}),
			del: jest.fn((key: string) => {
				store.delete(key)
				return Promise.resolve(1)
			}),
			exists: jest.fn((key: string) => Promise.resolve(store.has(key) ? 1 : 0)),
			setEx: jest.fn((key: string, _ttl: number, value: string) => {
				store.set(key, value)
				return Promise.resolve('OK')
			}),
		}

		;(createClient as jest.Mock).mockReturnValue(mockClient)

		const module: TestingModule = await Test.createTestingModule({
			providers: [
				RedisService,
				{
					provide: ConfigService,
					useValue: {
						get: jest.fn((key: string, defaultValue?: unknown) => {
							const config: Record<string, unknown> = {
								REDIS_HOST: 'localhost',
								REDIS_PORT: 6379,
								REDIS_PASSWORD: undefined,
							}
							return config[key] ?? defaultValue
						}),
					},
				},
			],
		}).compile()

		service = module.get<RedisService>(RedisService)
		await service.onModuleInit()
	})

	afterEach(async () => {
		await service.onModuleDestroy()
		jest.clearAllMocks()
	})

	describe('Property 4: Redis CRUD round-trip', () => {
		// Validates: Requirements 2.2, 2.3
		it('get after set returns the same value for any key and string value', async () => {
			await fc.assert(
				fc.asyncProperty(fc.string(), fc.string(), async (key, value) => {
					store.clear()
					await service.set(key, value)
					const result = await service.get(key)
					return result === value
				}),
				{ numRuns: 100 },
			)
		})
	})

	describe('Property 5: Distributed lock mutual exclusion', () => {
		// Feature: backend-infrastructure, Property 5: Distributed lock mutual exclusion
		// Validates: Requirements 2.7, 2.9
		it('second acquireLock returns false while lock is held', async () => {
			await fc.assert(
				fc.asyncProperty(fc.string(), fc.integer({ min: 1, max: 60 }), async (key, ttl) => {
					store.clear()
					const first = await service.acquireLock(key, ttl)
					const second = await service.acquireLock(key, ttl)
					return first === true && second === false
				}),
				{ numRuns: 100 },
			)
		})
	})

	describe('Property 6: Lock release restores availability', () => {
		// Feature: backend-infrastructure, Property 6: Lock release restores availability
		// Validates: Requirements 2.8
		it('acquireLock returns true after releaseLock for any lock key', async () => {
			await fc.assert(
				fc.asyncProperty(fc.string(), fc.integer({ min: 1, max: 60 }), async (key, ttl) => {
					store.clear()
					const acquired = await service.acquireLock(key, ttl)
					await service.releaseLock(key)
					const reacquired = await service.acquireLock(key, ttl)
					return acquired === true && reacquired === true
				}),
				{ numRuns: 100 },
			)
		})
	})

	describe('Unit tests', () => {
		let mockClient: Record<string, jest.Mock>

		beforeEach(() => {
			mockClient = (createClient as jest.Mock).mock.results[0].value as Record<string, jest.Mock>
		})

		// Req 2.2
		it('get delegates to client.get with the correct key', async () => {
			mockClient.get.mockResolvedValueOnce('hello')
			const result = await service.get('mykey')
			expect(mockClient.get).toHaveBeenCalledWith('mykey')
			expect(result).toBe('hello')
		})

		// Req 2.3
		it('set delegates to client.set with correct key and value', async () => {
			await service.set('k', 'v')
			expect(mockClient.set).toHaveBeenCalledWith('k', 'v')
		})

		// Req 2.4
		it('setex delegates to client.setEx with correct key, ttl, and value', async () => {
			await service.setex('k', 30, 'v')
			expect(mockClient.setEx).toHaveBeenCalledWith('k', 30, 'v')
		})

		// Req 2.5
		it('del delegates to client.del with the correct key', async () => {
			await service.del('k')
			expect(mockClient.del).toHaveBeenCalledWith('k')
		})

		// Req 2.6
		it('exists returns true when client returns 1', async () => {
			mockClient.exists.mockResolvedValueOnce(1)
			expect(await service.exists('k')).toBe(true)
		})

		it('exists returns false when client returns 0', async () => {
			mockClient.exists.mockResolvedValueOnce(0)
			expect(await service.exists('k')).toBe(false)
		})

		// Req 2.7
		it('acquireLock calls client.set with NX and EX options and returns true on OK', async () => {
			mockClient.set.mockResolvedValueOnce('OK')
			const result = await service.acquireLock('lock:key', 10)
			expect(mockClient.set).toHaveBeenCalledWith('lock:key', expect.any(String), {
				NX: true,
				EX: 10,
			})
			expect(result).toBe(true)
		})

		// Req 2.9
		it('acquireLock returns false when client returns null (key already exists)', async () => {
			mockClient.set.mockResolvedValueOnce(null)
			const result = await service.acquireLock('lock:key', 10)
			expect(result).toBe(false)
		})

		// Req 2.8
		it('releaseLock calls client.del with the correct key', async () => {
			await service.releaseLock('lock:key')
			expect(mockClient.del).toHaveBeenCalledWith('lock:key')
		})

		// Req 2.1
		it('onModuleInit calls client.connect()', async () => {
			mockClient.connect.mockClear()
			await service.onModuleInit()
			expect(mockClient.connect).toHaveBeenCalledTimes(1)
		})

		it('onModuleDestroy calls client.quit()', async () => {
			mockClient.quit.mockClear()
			await service.onModuleDestroy()
			expect(mockClient.quit).toHaveBeenCalledTimes(1)
		})
	})
})
