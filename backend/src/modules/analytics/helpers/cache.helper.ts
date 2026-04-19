import { Logger } from '@nestjs/common'
import { RedisService } from '@/core/redis/redis.service'

/**
 * Helper class for caching analytics queries
 * Encapsulates Redis interaction logic with error handling
 */
export class CacheHelper {
	private readonly logger = new Logger(CacheHelper.name)
	private readonly TTL = 60 // 60 seconds

	constructor(private readonly redisService: RedisService) {}

	/**
	 * Builds cache key from endpoint and DTO parameters
	 * Filters out undefined/null values and sorts keys for consistency
	 */
	buildCacheKey(endpoint: string, dto: Record<string, unknown>): string {
		const defined = Object.fromEntries(
			Object.entries(dto).filter(([, v]) => v !== undefined && v !== null),
		)
		const sorted = Object.keys(defined)
			.sort()
			.map((k) => `${k}=${String(defined[k])}`)
			.join('&')
		return `analytics:${endpoint}:${sorted}`
	}

	/**
	 * Executes function with caching
	 * Tries to read from cache first, falls back to function execution
	 * Handles Redis errors gracefully without breaking the flow
	 */
	async withCache<T>(cacheKey: string, fn: () => Promise<T>): Promise<T> {
		// Try to read from cache
		try {
			const cached = await this.redisService.get(cacheKey)
			if (cached) {
				this.logger.debug(`Cache hit for key: ${cacheKey}`)
				return JSON.parse(cached) as T
			}
		} catch (err: unknown) {
			this.logger.warn(
				`Redis read failed for key ${cacheKey}: ${err instanceof Error ? err.message : String(err)}`,
			)
		}

		// Execute function
		const result = await fn()

		// Try to write to cache
		try {
			await this.redisService.setex(cacheKey, this.TTL, JSON.stringify(result))
			this.logger.debug(`Cache set for key: ${cacheKey}`)
		} catch (err: unknown) {
			this.logger.warn(
				`Redis write failed for key ${cacheKey}: ${err instanceof Error ? err.message : String(err)}`,
			)
		}

		return result
	}
}
