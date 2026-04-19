import { Injectable } from '@nestjs/common'

import { ClickhouseService } from '@/core/clickhouse/clickhouse.service'
import { RedisService } from '@/core/redis/redis.service'
import { PromocodesQueryDTO } from './dto/promocodes-query.dto'
import { PromoUsagesQueryDTO } from './dto/promo-usages-query.dto'
import { UsersQueryDTO } from './dto/users-query.dto'
import { AnalyticsPromocode } from './interfaces/analytics-promocode.interface'
import { AnalyticsPromoUsage } from './interfaces/analytics-promo-usage.interface'
import { AnalyticsUser } from './interfaces/analytics-user.interface'
import { PaginatedResponse } from './interfaces/paginated-response.interface'
import { UsersSummaryResponse } from './interfaces/users-summary-response.interface'
import { UsersQueryBuilder, PromocodesQueryBuilder, PromoUsagesQueryBuilder } from './builders'
import { CacheHelper, QueryExecutorHelper, DateRangeHelper } from './helpers'

/**
 * Analytics Service - Clean architecture implementation
 *
 * Responsibilities:
 * - Coordinate query building, execution, and caching
 * - Provide high-level API for analytics data
 *
 * Delegates to:
 * - QueryBuilders: SQL generation logic
 * - QueryExecutorHelper: ClickHouse query execution
 * - CacheHelper: Redis caching logic
 * - DateRangeHelper: Date range resolution
 */
@Injectable()
export class AnalyticsService {
	private readonly cacheHelper: CacheHelper
	private readonly queryExecutor: QueryExecutorHelper

	constructor(
		private readonly clickhouseService: ClickhouseService,
		private readonly redisService: RedisService,
	) {
		this.cacheHelper = new CacheHelper(redisService)
		this.queryExecutor = new QueryExecutorHelper(clickhouseService)
	}

	// ---------------------------------------------------------------------------
	// Public API
	// ---------------------------------------------------------------------------

	/**
	 * Get paginated users with analytics data
	 * Supports filtering by status, search, and date range
	 */
	async getUsers(dto: UsersQueryDTO): Promise<PaginatedResponse<AnalyticsUser>> {
		const cacheKey = this.cacheHelper.buildCacheKey('users', dto as Record<string, unknown>)

		return this.cacheHelper.withCache(cacheKey, async () => {
			const { dateFrom, dateTo } = DateRangeHelper.resolveDateRange(dto.dateFrom, dto.dateTo)
			const { sql, countSql, params } = UsersQueryBuilder.buildUsersQuery(dto, dateFrom, dateTo)
			return this.queryExecutor.executePaginatedQuery<AnalyticsUser>(sql, countSql, params, dto)
		})
	}

	/**
	 * Get paginated promocodes with analytics data
	 * Supports filtering by status, search, and date range
	 */
	async getPromocodes(dto: PromocodesQueryDTO): Promise<PaginatedResponse<AnalyticsPromocode>> {
		const cacheKey = this.cacheHelper.buildCacheKey('promocodes', dto as Record<string, unknown>)

		return this.cacheHelper.withCache(cacheKey, async () => {
			const { dateFrom, dateTo } = DateRangeHelper.resolveDateRange(dto.dateFrom, dto.dateTo)
			const { sql, countSql, params } = PromocodesQueryBuilder.buildPromocodesQuery(
				dto,
				dateFrom,
				dateTo,
			)
			return this.queryExecutor.executePaginatedQuery<AnalyticsPromocode>(
				sql,
				countSql,
				params,
				dto,
			)
		})
	}

	/**
	 * Get paginated promo usages history
	 * Supports search and date range filtering
	 */
	async getPromoUsages(dto: PromoUsagesQueryDTO): Promise<PaginatedResponse<AnalyticsPromoUsage>> {
		const cacheKey = this.cacheHelper.buildCacheKey('promo-usages', dto as Record<string, unknown>)

		return this.cacheHelper.withCache(cacheKey, async () => {
			const { dateFrom, dateTo } = DateRangeHelper.resolveDateRange(dto.dateFrom, dto.dateTo)
			const { sql, countSql, params } = PromoUsagesQueryBuilder.buildPromoUsagesQuery(
				dto,
				dateFrom,
				dateTo,
			)
			return this.queryExecutor.executePaginatedQuery<AnalyticsPromoUsage>(
				sql,
				countSql,
				params,
				dto,
			)
		})
	}

	/**
	 * Get users summary metrics (total, active, average check)
	 * Uses optimized CTE query to avoid JOIN multiplication
	 */
	async getUsersSummary(dateFrom?: string, dateTo?: string): Promise<UsersSummaryResponse> {
		const { dateFrom: resolvedDateFrom, dateTo: resolvedDateTo } = DateRangeHelper.resolveDateRange(
			dateFrom,
			dateTo,
		)
		const cacheKey = this.cacheHelper.buildCacheKey('users:summary', {
			dateFrom: resolvedDateFrom,
			dateTo: resolvedDateTo,
		})

		return this.cacheHelper.withCache(cacheKey, async () => {
			const { sql, params } = UsersQueryBuilder.buildUsersSummaryQuery(
				resolvedDateFrom,
				resolvedDateTo,
			)
			const result = await this.queryExecutor.executeQuery<{
				totalUsers: string
				activeUsers: string
				averageCheck: string
			}>(sql, params)

			const row = result[0]
			return {
				totalUsers: parseInt(row?.totalUsers ?? '0', 10),
				activeUsers: parseInt(row?.activeUsers ?? '0', 10),
				averageCheck: parseFloat(row?.averageCheck ?? '0'),
			}
		})
	}
}
