import { InternalServerErrorException, Logger } from '@nestjs/common'
import { ClickhouseService } from '@/core/clickhouse/clickhouse.service'
import { PaginatedResponse } from '../interfaces/paginated-response.interface'

/**
 * Helper class for executing ClickHouse queries
 * Encapsulates query execution logic with error handling
 */
export class QueryExecutorHelper {
	private readonly logger = new Logger(QueryExecutorHelper.name)

	constructor(private readonly clickhouseService: ClickhouseService) {}

	/**
	 * Executes a single ClickHouse query
	 * Wraps errors in InternalServerErrorException
	 */
	async executeQuery<T>(sql: string, params: Record<string, unknown>): Promise<T[]> {
		try {
			return await this.clickhouseService.query<T>(sql, params)
		} catch (err: unknown) {
			this.logger.error(
				`Analytics query failed: ${err instanceof Error ? err.message : String(err)}`,
			)
			throw new InternalServerErrorException('Analytics query failed')
		}
	}

	/**
	 * Executes paginated query (data + count) in parallel
	 * Returns formatted PaginatedResponse
	 */
	async executePaginatedQuery<T>(
		sql: string,
		countSql: string,
		params: Record<string, unknown>,
		dto: { page?: number; pageSize?: number },
	): Promise<PaginatedResponse<T>> {
		const [data, countRows] = await Promise.all([
			this.executeQuery<T>(sql, params),
			this.executeQuery<{ total: string }>(countSql, params),
		])

		return {
			data,
			total: parseInt(countRows[0]?.total ?? '0', 10),
			page: dto.page ?? 1,
			pageSize: dto.pageSize ?? 10,
		}
	}
}
