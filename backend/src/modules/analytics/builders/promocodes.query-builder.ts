import { SortOrder } from '../dto/analytics-query.dto'
import { PROMOCODES_SORT_COLUMNS, PromocodesQueryDTO } from '../dto/promocodes-query.dto'
import { QueryResult } from './types'

export class PromocodesQueryBuilder {
	/**
	 * Builds optimized promocodes query with CTE to avoid JOIN multiplication
	 * Uses subqueries for aggregations instead of LEFT JOIN before pagination
	 */
	static buildPromocodesQuery(
		dto: PromocodesQueryDTO,
		dateFrom: string,
		dateTo: string,
	): QueryResult {
		const page = dto.page ?? 1
		const pageSize = dto.pageSize ?? 10
		const offset = (page - 1) * pageSize
		const sortBy = PROMOCODES_SORT_COLUMNS.includes(dto.sortBy as never)
			? dto.sortBy!
			: 'createdAt'
		const sortOrder = dto.sortOrder === SortOrder.ASC ? 'ASC' : 'DESC'

		const params: Record<string, unknown> = {
			dateFrom,
			dateTo,
			pageSize,
			offset,
		}

		// Build WHERE conditions
		const conditions: string[] = [
			'createdAt >= {dateFrom:DateTime}',
			'createdAt <= {dateTo:DateTime}',
		]

		if (dto.isActive !== undefined) {
			params.isActive = dto.isActive ? 1 : 0
			conditions.push('isActive = {isActive:UInt8}')
		}

		if (dto.search) {
			params.search = `%${dto.search}%`
			conditions.push('ilike(code, {search:String})')
		}

		const whereClause = conditions.join(' AND ')

		/**
		 * Optimized query using CTE:
		 * 1. Filter and paginate promocodes first (base_promocodes)
		 * 2. Then aggregate promo_usages only for selected promocodes
		 * This avoids multiplying promocode rows before pagination
		 */
		const sql = `
WITH
    base_promocodes AS (
        SELECT
            id,
            code,
            discount,
            totalLimit,
            userLimit,
            isActive,
            createdAt
        FROM promocode_analytics.promocodes
        WHERE ${whereClause}
        ORDER BY ${sortBy} ${sortOrder}
        LIMIT {pageSize:UInt32} OFFSET {offset:UInt32}
    )
SELECT
    p.id,
    p.code,
    p.discount,
    p.totalLimit,
    p.userLimit,
    p.isActive,
    p.createdAt,
    (SELECT count() FROM promocode_analytics.promo_usages WHERE promocodeId = p.id) AS usageCount,
    (SELECT sum(orderAmount) FROM promocode_analytics.promo_usages WHERE promocodeId = p.id) AS totalRevenue,
    (SELECT uniq(userId) FROM promocode_analytics.promo_usages WHERE promocodeId = p.id) AS uniqueUsers,
    (SELECT sum(discountAmount) FROM promocode_analytics.promo_usages WHERE promocodeId = p.id) AS totalDiscount
FROM base_promocodes p
ORDER BY ${sortBy} ${sortOrder}
`.trim()

		const countSql = `
SELECT count() AS total
FROM promocode_analytics.promocodes
WHERE ${whereClause}
`.trim()

		return { sql, countSql, params }
	}
}
