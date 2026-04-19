import { SortOrder } from '../dto/analytics-query.dto'
import { PROMOCODES_SORT_COLUMNS, PromocodesQueryDTO } from '../dto/promocodes-query.dto'
import { QueryResult } from './types'

export class PromocodesQueryBuilder {
	/**
	 * Builds optimized promocodes query with proper deduplication using argMax.
	 *
	 * ClickHouse constraint: MergeTree doesn't deduplicate automatically.
	 * Each update/deactivation inserts a new row, so we must pick the latest
	 * version of each promocode via argMax(field, updatedAt).
	 */
	static buildPromocodesQuery(
		dto: PromocodesQueryDTO,
		dateFrom: string,
		dateTo: string,
	): QueryResult {
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

		// Filter conditions applied AFTER deduplication
		const filterConditions: string[] = []

		if (dto.isActive !== undefined) {
			params.isActive = dto.isActive ? 1 : 0
			filterConditions.push('last_status = {isActive:UInt8}')
		}

		if (dto.search) {
			params.search = `%${dto.search}%`
			filterConditions.push('ilike(code, {search:String})')
		}

		const filterClause = filterConditions.length > 0 ? `AND ${filterConditions.join(' AND ')}` : ''

		/**
		 * Query strategy (mirrors users.query-builder.ts):
		 * 1. Subquery filters by createdAt date range BEFORE deduplication
		 * 2. CTE deduplicates using argMax(field, updatedAt) — picks latest row per id
		 * 3. Pre-aggregate promo_usages by promocodeId (no row multiplication)
		 * 4. LEFT JOIN aggregated stats onto deduplicated promocodes
		 * 5. Filter by isActive / search, then paginate
		 */
		const sql = `
WITH
    latest_promocodes AS (
        SELECT
            id,
            argMax(code, updatedAt)       AS code,
            argMax(discount, updatedAt)   AS discount,
            argMax(discountType, updatedAt) AS discountType,
            argMax(totalLimit, updatedAt) AS totalLimit,
            argMax(userLimit, updatedAt)  AS userLimit,
            argMax(dateFrom, updatedAt)   AS dateFrom,
            argMax(dateTo, updatedAt)     AS dateTo,
            argMax(isActive, updatedAt)   AS last_status,
            any(createdAt)                AS createdAt
        FROM (
            SELECT *
            FROM promocode_analytics.promocodes
            WHERE createdAt >= {dateFrom:DateTime}
              AND createdAt <= {dateTo:DateTime}
        )
        GROUP BY id
    ),
    promo_agg AS (
        SELECT
            promocodeId,
            count()            AS usageCount,
            sum(orderAmount)   AS totalRevenue,
            uniq(userId)       AS uniqueUsers,
            sum(discountAmount) AS totalDiscount
        FROM promocode_analytics.promo_usages
        GROUP BY promocodeId
    ),
    promocodes_with_stats AS (
        SELECT
            p.id,
            p.code,
            p.discount,
            p.discountType,
            p.totalLimit,
            p.userLimit,
            p.dateFrom,
            p.dateTo,
            p.last_status,
            p.createdAt,
            coalesce(a.usageCount, 0)    AS usageCount,
            coalesce(a.totalRevenue, 0)  AS totalRevenue,
            coalesce(a.uniqueUsers, 0)   AS uniqueUsers,
            coalesce(a.totalDiscount, 0) AS totalDiscount
        FROM latest_promocodes p
        LEFT JOIN promo_agg a ON p.id = a.promocodeId
    ),
    filtered_promocodes AS (
        SELECT *
        FROM promocodes_with_stats
        WHERE 1=1 ${filterClause}
        ORDER BY ${sortBy} ${sortOrder}
        LIMIT {pageSize:UInt32} OFFSET {offset:UInt32}
    )
SELECT
    id,
    code,
    discount,
    discountType,
    totalLimit,
    userLimit,
    dateFrom,
    dateTo,
    last_status AS isActive,
    createdAt,
    usageCount,
    totalRevenue,
    uniqueUsers,
    totalDiscount
FROM filtered_promocodes
ORDER BY ${sortBy} ${sortOrder}
`.trim()

		const countSql = `
WITH
    latest_promocodes AS (
        SELECT
            id,
            argMax(isActive, updatedAt) AS last_status,
            argMax(code, updatedAt)     AS code
        FROM (
            SELECT *
            FROM promocode_analytics.promocodes
            WHERE createdAt >= {dateFrom:DateTime}
              AND createdAt <= {dateTo:DateTime}
        )
        GROUP BY id
    )
SELECT count() AS total
FROM latest_promocodes
WHERE 1=1 ${filterClause}
`.trim()

		return { sql, countSql, params }
	}
}
