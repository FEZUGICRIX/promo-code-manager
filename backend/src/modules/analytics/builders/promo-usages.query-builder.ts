import { SortOrder } from '../dto/analytics-query.dto'
import { PROMO_USAGES_SORT_COLUMNS, PromoUsagesQueryDTO } from '../dto/promo-usages-query.dto'
import { QueryResult } from './types'

export class PromoUsagesQueryBuilder {
	/**
	 * Builds promo usages query with search and pagination
	 * This table is already denormalized, no JOINs needed
	 */
	static buildPromoUsagesQuery(
		dto: PromoUsagesQueryDTO,
		dateFrom: string,
		dateTo: string,
	): QueryResult {
		const pageSize = Number(dto.pageSize) || 10
		const offset = ((Number(dto.page) || 1) - 1) * pageSize

		// Validate sort column (whitelist)
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

		// Build WHERE conditions
		const conditions: string[] = [
			'createdAt >= {dateFrom:DateTime}',
			'createdAt <= {dateTo:DateTime}',
		]

		if (dto.search) {
			params.search = `%${dto.search}%`
			conditions.push(
				'(ilike(promocodeCode, {search:String}) OR ilike(userName, {search:String}) OR ilike(userEmail, {search:String}))',
			)
		}

		const whereClause = `WHERE ${conditions.join(' AND ')}`

		const sql = `
SELECT
    id,
    promocodeCode,
    promocodeDiscount,
    promocodeDiscountType,
    userName,
    userEmail,
    orderId,
    orderAmount,
    discountAmount,
    createdAt
FROM promocode_analytics.promo_usages
${whereClause}
ORDER BY ${sortBy} ${sortOrder}
LIMIT {pageSize:UInt32} OFFSET {offset:UInt32}
`.trim()

		const countSql = `
SELECT count() AS total
FROM promocode_analytics.promo_usages
${whereClause}
`.trim()

		return { sql, countSql, params }
	}
}
