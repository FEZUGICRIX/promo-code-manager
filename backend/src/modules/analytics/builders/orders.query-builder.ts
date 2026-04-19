import { SortOrder } from '../dto/analytics-query.dto'
import { ORDERS_SORT_COLUMNS, OrdersQueryDTO } from '../dto/orders-query.dto'
import { QueryResult } from './types'

export class OrdersQueryBuilder {
	/**
	 * Builds orders query with search, date range filter, sorting and pagination
	 */
	static buildOrdersQuery(dto: OrdersQueryDTO, dateFrom: string, dateTo: string): QueryResult {
		const pageSize = Number(dto.pageSize) || 10
		const offset = ((Number(dto.page) || 1) - 1) * pageSize

		// Validate sort column (whitelist)
		const sortBy = ORDERS_SORT_COLUMNS.includes(dto.sortBy as never) ? dto.sortBy! : 'createdAt'
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
			conditions.push('(ilike(userName, {search:String}) OR ilike(userEmail, {search:String}))')
		}

		const whereClause = `WHERE ${conditions.join(' AND ')}`

		const sql = `
SELECT
    id,
    userId,
    userName,
    userEmail,
    amount,
    discount,
    finalAmount,
    promocodeId,
    promocodeCode,
    createdAt
FROM promocode_analytics.orders
${whereClause}
ORDER BY ${sortBy} ${sortOrder}
LIMIT {pageSize:UInt32} OFFSET {offset:UInt32}
`.trim()

		const countSql = `
SELECT count() AS total
FROM promocode_analytics.orders
${whereClause}
`.trim()

		return { sql, countSql, params }
	}
}
