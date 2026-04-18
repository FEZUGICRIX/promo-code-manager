import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common'

import { ClickhouseService } from '@/core/clickhouse/clickhouse.service'
import { RedisService } from '@/core/redis/redis.service'
import { SortOrder } from './dto/analytics-query.dto'
import { PROMOCODES_SORT_COLUMNS, PromocodesQueryDTO } from './dto/promocodes-query.dto'
import { PROMO_USAGES_SORT_COLUMNS, PromoUsagesQueryDTO } from './dto/promo-usages-query.dto'
import { USERS_SORT_COLUMNS, UsersQueryDTO } from './dto/users-query.dto'
import { AnalyticsPromocode } from './interfaces/analytics-promocode.interface'
import { AnalyticsPromoUsage } from './interfaces/analytics-promo-usage.interface'
import { AnalyticsUser } from './interfaces/analytics-user.interface'
import { PaginatedResponse } from './interfaces/paginated-response.interface'

@Injectable()
export class AnalyticsService {
	private readonly logger = new Logger(AnalyticsService.name)

	constructor(
		private readonly clickhouseService: ClickhouseService,
		private readonly redisService: RedisService,
	) {}

	// ---------------------------------------------------------------------------
	// Public API
	// ---------------------------------------------------------------------------

	async getUsers(dto: UsersQueryDTO): Promise<PaginatedResponse<AnalyticsUser>> {
		const cacheKey = this.buildCacheKey('users', dto as Record<string, unknown>)
		return this.withCache(cacheKey, async () => {
			const { sql, countSql, params } = this.buildUsersQuery(dto)
			const [data, countRows] = await Promise.all([
				this.executeQuery<AnalyticsUser>(sql, params),
				this.executeQuery<{ total: string }>(countSql, params),
			])
			return this.buildResponse(data, countRows, dto)
		})
	}

	async getPromocodes(dto: PromocodesQueryDTO): Promise<PaginatedResponse<AnalyticsPromocode>> {
		const cacheKey = this.buildCacheKey('promocodes', dto as Record<string, unknown>)
		return this.withCache(cacheKey, async () => {
			const { sql, countSql, params } = this.buildPromocodesQuery(dto)
			const [data, countRows] = await Promise.all([
				this.executeQuery<AnalyticsPromocode>(sql, params),
				this.executeQuery<{ total: string }>(countSql, params),
			])
			return this.buildResponse(data, countRows, dto)
		})
	}

	async getPromoUsages(dto: PromoUsagesQueryDTO): Promise<PaginatedResponse<AnalyticsPromoUsage>> {
		const cacheKey = this.buildCacheKey('promo-usages', dto as Record<string, unknown>)
		return this.withCache(cacheKey, async () => {
			const { sql, countSql, params } = this.buildPromoUsagesQuery(dto)
			const [data, countRows] = await Promise.all([
				this.executeQuery<AnalyticsPromoUsage>(sql, params),
				this.executeQuery<{ total: string }>(countSql, params),
			])
			return this.buildResponse(data, countRows, dto)
		})
	}

	// ---------------------------------------------------------------------------
	// Cache helpers
	// ---------------------------------------------------------------------------

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

	async withCache<T>(cacheKey: string, fn: () => Promise<T>): Promise<T> {
		try {
			const cached = await this.redisService.get(cacheKey)
			if (cached) return JSON.parse(cached) as T
		} catch (err: unknown) {
			this.logger.warn(
				`Redis read failed for key ${cacheKey}: ${err instanceof Error ? err.message : String(err)}`,
			)
		}

		const result = await fn()

		try {
			await this.redisService.setex(cacheKey, 60, JSON.stringify(result))
		} catch (err: unknown) {
			this.logger.warn(
				`Redis write failed for key ${cacheKey}: ${err instanceof Error ? err.message : String(err)}`,
			)
		}

		return result
	}

	// ---------------------------------------------------------------------------
	// Date range helper
	// ---------------------------------------------------------------------------

	resolveDateRange(dateFrom?: string, dateTo?: string): { dateFrom: string; dateTo: string } {
		const now = new Date()
		const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
		return {
			dateFrom: dateFrom ?? thirtyDaysAgo.toISOString().slice(0, 19).replace('T', ' '),
			dateTo: dateTo ?? now.toISOString().slice(0, 19).replace('T', ' '),
		}
	}

	// ---------------------------------------------------------------------------
	// Query builders
	// ---------------------------------------------------------------------------

	buildUsersQuery(dto: UsersQueryDTO): {
		sql: string
		countSql: string
		params: Record<string, unknown>
	} {
		const { dateFrom, dateTo } = this.resolveDateRange(dto.dateFrom, dto.dateTo)
		const page = dto.page ?? 1
		const pageSize = dto.pageSize ?? 10
		const offset = (page - 1) * pageSize
		const sortBy = USERS_SORT_COLUMNS.includes(dto.sortBy as never) ? dto.sortBy! : 'createdAt'
		const sortOrder = dto.sortOrder === SortOrder.ASC ? 'ASC' : 'DESC'

		const params: Record<string, unknown> = {
			dateFrom,
			dateTo,
			pageSize,
			offset,
		}

		let whereExtra = ''
		if (dto.isActive !== undefined) {
			params.isActive = dto.isActive ? 1 : 0
			whereExtra += ' AND u.isActive = {isActive:UInt8}'
		}
		if (dto.search) {
			params.search = `%${dto.search}%`
			whereExtra += ' AND (ilike(u.name, {search:String}) OR ilike(u.email, {search:String}))'
		}

		const baseWhere = `u.createdAt >= {dateFrom:DateTime}
  AND u.createdAt <= {dateTo:DateTime}${whereExtra}`

		// Columns that belong to the users table and need the alias prefix in ORDER BY
		const USERS_TABLE_COLUMNS = new Set(['id', 'name', 'email', 'phone', 'isActive', 'createdAt'])
		const orderByClause = `${sortBy} ${sortOrder}`
		const sql = `
SELECT
  u.id AS id,
  any(u.name) AS name,
  any(u.email) AS email,
  any(u.phone) AS phone,
  any(u.isActive) AS isActive,
  any(u.createdAt) AS createdAt,
  countIf(o.id != '') AS totalOrders,
  sumIf(o.amount, o.id != '') AS totalSpent,
  sumIf(o.discount, o.id != '') AS totalDiscount,
  countIf(pu.id != '') AS promoUsagesCount
FROM promocode_analytics.users u
LEFT JOIN promocode_analytics.orders o ON u.id = o.userId
LEFT JOIN promocode_analytics.promo_usages pu ON u.id = pu.userId
WHERE ${baseWhere}
GROUP BY u.id
ORDER BY ${orderByClause}
LIMIT {pageSize:UInt32} OFFSET {offset:UInt32}`

		const countSql = `
SELECT count() AS total
FROM (
  SELECT u.id
  FROM promocode_analytics.users u
  LEFT JOIN promocode_analytics.orders o ON u.id = o.userId
  LEFT JOIN promocode_analytics.promo_usages pu ON u.id = pu.userId
  WHERE ${baseWhere}
  GROUP BY u.id
)`

		return { sql, countSql, params }
	}

	buildPromocodesQuery(dto: PromocodesQueryDTO): {
		sql: string
		countSql: string
		params: Record<string, unknown>
	} {
		const { dateFrom, dateTo } = this.resolveDateRange(dto.dateFrom, dto.dateTo)
		const page = dto.page ?? 1
		const pageSize = dto.pageSize ?? 10
		const offset = (page - 1) * pageSize
		const sortBy = PROMOCODES_SORT_COLUMNS.includes(dto.sortBy as never) ? dto.sortBy! : 'createdAt'
		const sortOrder = dto.sortOrder === SortOrder.ASC ? 'ASC' : 'DESC'

		const params: Record<string, unknown> = {
			dateFrom,
			dateTo,
			pageSize,
			offset,
		}

		let whereExtra = ''
		if (dto.isActive !== undefined) {
			params.isActive = dto.isActive ? 1 : 0
			whereExtra += ' AND p.isActive = {isActive:UInt8}'
		}
		if (dto.search) {
			params.search = `%${dto.search}%`
			whereExtra += ' AND ilike(p.code, {search:String})'
		}

		const baseWhere = `p.createdAt >= {dateFrom:DateTime}
  AND p.createdAt <= {dateTo:DateTime}${whereExtra}`

		// Columns that belong to the promocodes table and need the alias prefix in ORDER BY
		const PROMOCODES_TABLE_COLUMNS = new Set([
			'id',
			'code',
			'discount',
			'totalLimit',
			'userLimit',
			'isActive',
			'createdAt',
		])
		const orderByClause = PROMOCODES_TABLE_COLUMNS.has(sortBy)
			? `p.${sortBy} ${sortOrder}`
			: `${sortBy} ${sortOrder}`

		const sql = `
SELECT
  p.id AS id,
  p.code AS code,
  p.discount AS discount,
  p.totalLimit AS totalLimit,
  p.userLimit AS userLimit,
  p.isActive AS isActive,
  p.createdAt AS createdAt,
  count(pu.id) AS usageCount,
  sum(pu.orderAmount) AS totalRevenue,
  uniq(pu.userId) AS uniqueUsers,
  sum(pu.discountAmount) AS totalDiscount
FROM promocode_analytics.promocodes p
LEFT JOIN promocode_analytics.promo_usages pu ON p.id = pu.promocodeId
WHERE ${baseWhere}
GROUP BY p.id, p.code, p.discount, p.totalLimit, p.userLimit, p.isActive, p.createdAt
ORDER BY ${orderByClause}
LIMIT {pageSize:UInt32} OFFSET {offset:UInt32}`

		const countSql = `
SELECT count() AS total
FROM (
  SELECT p.id
  FROM promocode_analytics.promocodes p
  LEFT JOIN promocode_analytics.promo_usages pu ON p.id = pu.promocodeId
  WHERE ${baseWhere}
  GROUP BY p.id
)`

		return { sql, countSql, params }
	}

	buildPromoUsagesQuery(dto: PromoUsagesQueryDTO): {
		sql: string
		countSql: string
		params: Record<string, unknown>
	} {
		const { dateFrom, dateTo } = this.resolveDateRange(dto.dateFrom, dto.dateTo)
		const page = dto.page ?? 1
		const pageSize = dto.pageSize ?? 10
		const offset = (page - 1) * pageSize
		const sortBy = PROMO_USAGES_SORT_COLUMNS.includes(dto.sortBy as never)
			? dto.sortBy!
			: 'createdAt'
		const sortOrder = dto.sortOrder === SortOrder.ASC ? 'ASC' : 'DESC'

		const params: Record<string, unknown> = {
			dateFrom,
			dateTo,
			pageSize,
			offset,
		}

		let whereExtra = ''
		if (dto.search) {
			params.search = `%${dto.search}%`
			whereExtra +=
				' AND (ilike(promocodeCode, {search:String}) OR ilike(userName, {search:String}))'
		}

		const sql = `
SELECT
  id,
  promocodeCode,
  promocodeDiscount,
  userName,
  userEmail,
  orderId,
  orderAmount,
  discountAmount,
  createdAt
FROM promocode_analytics.promo_usages
WHERE createdAt >= {dateFrom:DateTime}
  AND createdAt <= {dateTo:DateTime}${whereExtra}
ORDER BY ${sortBy} ${sortOrder}
LIMIT {pageSize:UInt32} OFFSET {offset:UInt32}`

		const countSql = `
SELECT count() AS total
FROM promocode_analytics.promo_usages
WHERE createdAt >= {dateFrom:DateTime}
  AND createdAt <= {dateTo:DateTime}${whereExtra}`

		return { sql, countSql, params }
	}

	// ---------------------------------------------------------------------------
	// Private helpers
	// ---------------------------------------------------------------------------

	private async executeQuery<T>(sql: string, params: Record<string, unknown>): Promise<T[]> {
		try {
			return await this.clickhouseService.query<T>(sql, params)
		} catch (err: unknown) {
			this.logger.error(
				`Analytics query failed: ${err instanceof Error ? err.message : String(err)}`,
			)
			throw new InternalServerErrorException('Analytics query failed')
		}
	}

	private buildResponse<T>(
		data: T[],
		countRows: { total: string }[],
		dto: { page?: number; pageSize?: number },
	): PaginatedResponse<T> {
		return {
			data,
			total: parseInt(countRows[0]?.total ?? '0', 10),
			page: dto.page ?? 1,
			pageSize: dto.pageSize ?? 10,
		}
	}
}
