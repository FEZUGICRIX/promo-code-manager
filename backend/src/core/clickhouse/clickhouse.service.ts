import { Injectable, OnModuleInit, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { createClient, ClickHouseClient } from '@clickhouse/client'

@Injectable()
export class ClickhouseService implements OnModuleInit {
	private readonly client: ClickHouseClient
	private readonly logger = new Logger(ClickhouseService.name)
	private readonly database: string

	constructor(private readonly configService: ConfigService) {
		const host = this.configService.get<string>('CLICKHOUSE_HOST', 'localhost')
		const port = this.configService.get<string>('CLICKHOUSE_PORT', '8123')
		this.database = this.configService.get<string>('CLICKHOUSE_DATABASE', 'default')

		this.client = createClient({
			host: `http://${host}:${port}`,
			username: this.configService.get<string>('CLICKHOUSE_USER', 'default'),
			password: this.configService.get<string>('CLICKHOUSE_PASSWORD', ''),
			database: this.database,
		})
	}

	/**
	 * Выполняет типизированный SELECT запрос.
	 * Все пользовательские значения передаются через query_params — никакой интерполяции строк.
	 */
	async query<T>(query: string, params?: Record<string, unknown>): Promise<T[]> {
		try {
			const resultSet = await this.client.query({
				query,
				query_params: params,
				format: 'JSONEachRow',
			})
			return (await resultSet.json()) as T[]
		} catch (err: unknown) {
			throw this.wrapError('ClickHouse query failed', err)
		}
	}

	/**
	 * Вставляет массив объектов в таблицу через JSONEachRow.
	 */
	async insert<T extends Record<string, unknown>>(table: string, values: T[]): Promise<void> {
		try {
			await this.client.insert({
				table,
				values,
				format: 'JSONEachRow',
			})
		} catch (err: unknown) {
			throw this.wrapError('ClickHouse query failed', err)
		}
	}

	/**
	 * Идемпотентная инициализация: создаёт БД и все четыре таблицы при старте.
	 * Использует command() для DDL-операций согласно официальной документации.
	 */
	async onModuleInit(): Promise<void> {
		try {
			await this.client.command({
				query: `CREATE DATABASE IF NOT EXISTS ${this.database}`,
			})

			for (const ddl of this.getDdlStatements()) {
				await this.client.command({ query: ddl })
			}

			this.logger.log('ClickHouse tables initialized successfully')
		} catch (err: unknown) {
			this.logger.error(
				`ClickHouse initialization failed: ${err instanceof Error ? err.message : String(err)}`,
			)
			// Не бросаем ошибку — CH недоступность не должна блокировать запуск приложения
		}
	}

	private wrapError(message: string, cause: unknown): Error {
		const detail = cause instanceof Error ? cause.message : String(cause)
		this.logger.error(`${message}: ${detail}`)

		return new Error(`${message}: ${detail}`, { cause })
	}

	private getDdlStatements(): string[] {
		const db = this.database
		return [
			`CREATE TABLE IF NOT EXISTS ${db}.users (
				id String,
				email String,
				name String,
				phone String,
				isActive UInt8,
				createdAt DateTime,
				updatedAt DateTime
			) ENGINE = MergeTree()
			ORDER BY (createdAt, id)`,

			`CREATE TABLE IF NOT EXISTS ${db}.promocodes (
				id String,
				code String,
				discount Float32,
				totalLimit Int32,
				userLimit Int32,
				dateFrom Nullable(DateTime),
				dateTo Nullable(DateTime),
				isActive UInt8,
				createdAt DateTime,
				updatedAt DateTime
			) ENGINE = MergeTree()
			ORDER BY (createdAt, id)`,

			`CREATE TABLE IF NOT EXISTS ${db}.orders (
				id String,
				userId String,
				userName String,
				userEmail String,
				amount Float32,
				discount Float32,
				finalAmount Float32,
				promocodeId Nullable(String),
				promocodeCode Nullable(String),
				createdAt DateTime,
				updatedAt DateTime
			) ENGINE = MergeTree()
			ORDER BY (createdAt, id)`,

			`CREATE TABLE IF NOT EXISTS ${db}.promo_usages (
				id String,
				promocodeId String,
				promocodeCode String,
				promocodeDiscount Float32,
				userId String,
				userName String,
				userEmail String,
				orderId String,
				orderAmount Float32,
				discountAmount Float32,
				createdAt DateTime
			) ENGINE = MergeTree()
			ORDER BY (createdAt, id)`,
		]
	}
}
