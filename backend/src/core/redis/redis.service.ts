import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { createClient } from 'redis'
import { randomUUID } from 'crypto'

type RedisClient = ReturnType<typeof createClient>

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
	private readonly client: RedisClient
	private readonly logger = new Logger(RedisService.name)

	constructor(private readonly configService: ConfigService) {
		const host = this.configService.get<string>('REDIS_HOST', 'localhost')
		const port = this.configService.get<number>('REDIS_PORT', 6379)
		const password = this.configService.get<string>('REDIS_PASSWORD')

		this.client = createClient({
			socket: { host, port: Number(port) },
			...(password ? { password } : {}),
		})

		// error listener MUST be registered before connect() per node-redis docs
		this.client.on('error', (err: unknown) => {
			this.logger.error(`Redis client error: ${err instanceof Error ? err.message : String(err)}`)
		})
	}

	async onModuleInit(): Promise<void> {
		await this.client.connect()
	}

	async onModuleDestroy(): Promise<void> {
		await this.client.quit()
	}

	async get(key: string): Promise<string | null> {
		return this.client.get(key)
	}

	async set(key: string, value: string): Promise<void> {
		await this.client.set(key, value)
	}

	async setex(key: string, ttlSeconds: number, value: string): Promise<void> {
		await this.client.setEx(key, ttlSeconds, value)
	}

	async del(key: string): Promise<void> {
		await this.client.del(key)
	}

	async exists(key: string): Promise<boolean> {
		const count = await this.client.exists(key)
		return count > 0
	}

	/**
	 * Acquires a distributed lock via SET key <uuid> NX EX ttlSeconds.
	 * Returns true if the lock was acquired, false if the key already exists.
	 */
	async acquireLock(key: string, ttlSeconds: number): Promise<boolean> {
		const result = await this.client.set(key, randomUUID(), {
			NX: true,
			EX: ttlSeconds,
		})
		return result === 'OK'
	}

	/**
	 * Releases a distributed lock via DEL key.
	 */
	async releaseLock(key: string): Promise<void> {
		await this.client.del(key)
	}
}
