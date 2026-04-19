import { SortOrder } from '../dto/analytics-query.dto'
import { USERS_SORT_COLUMNS, UsersQueryDTO } from '../dto/users-query.dto'
import { QueryResult } from './types'

export class UsersQueryBuilder {
	/**
	 * Builds optimized users query with proper deduplication using argMax
	 *
	 * ClickHouse Constraint: Cannot use aggregate functions in WHERE clause
	 * Solution: Use subquery in FROM to filter BEFORE aggregation
	 */
	static buildUsersQuery(dto: UsersQueryDTO, dateFrom: string, dateTo: string): QueryResult {
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

		// Build filter conditions (applied AFTER deduplication)
		const filterConditions: string[] = []

		if (dto.isActive !== undefined) {
			params.isActive = dto.isActive ? 1 : 0
			filterConditions.push('last_status = {isActive:UInt8}')
		}

		if (dto.search) {
			params.search = `%${dto.search}%`
			filterConditions.push('(ilike(name, {search:String}) OR ilike(email, {search:String}))')
		}

		const filterClause = filterConditions.length > 0 ? `AND ${filterConditions.join(' AND ')}` : ''

		/**
		 * Query Strategy:
		 * 1. Subquery filters by date BEFORE deduplication
		 * 2. CTE deduplicates using argMax
		 * 3. Pre-aggregate orders and promo_usages by userId
		 * 4. JOIN aggregated data (no row multiplication)
		 * 5. Filter and paginate final result
		 */
		const sql = `
WITH
    latest_users AS (
        SELECT
            id,
            argMax(name, updatedAt) AS name,
            argMax(email, updatedAt) AS email,
            argMax(phone, updatedAt) AS phone,
            argMax(isActive, updatedAt) AS last_status,
            any(createdAt) AS createdAt
        FROM (
            SELECT *
            FROM promocode_analytics.users
            WHERE createdAt >= {dateFrom:DateTime}
              AND createdAt <= {dateTo:DateTime}
        )
        GROUP BY id
    ),
    orders_agg AS (
        SELECT
            userId,
            count() AS totalOrders,
            sum(amount) AS totalSpent,
            sum(discount) AS totalDiscount
        FROM promocode_analytics.orders
        GROUP BY userId
    ),
    promo_agg AS (
        SELECT
            userId,
            count() AS promoUsagesCount
        FROM promocode_analytics.promo_usages
        GROUP BY userId
    ),
    users_with_stats AS (
        SELECT
            u.id,
            u.name,
            u.email,
            u.phone,
            u.last_status,
            u.createdAt,
            coalesce(o.totalOrders, 0) AS totalOrders,
            coalesce(o.totalSpent, 0) AS totalSpent,
            coalesce(o.totalDiscount, 0) AS totalDiscount,
            coalesce(p.promoUsagesCount, 0) AS promoUsagesCount
        FROM latest_users u
        LEFT JOIN orders_agg o ON u.id = o.userId
        LEFT JOIN promo_agg p ON u.id = p.userId
    ),
    filtered_users AS (
        SELECT *
        FROM users_with_stats
        WHERE 1=1 ${filterClause}
        ORDER BY ${sortBy} ${sortOrder}
        LIMIT {pageSize:UInt32} OFFSET {offset:UInt32}
    )
SELECT
    id,
    name,
    email,
    phone,
    last_status AS isActive,
    createdAt,
    totalOrders,
    totalSpent,
    totalDiscount,
    promoUsagesCount
FROM filtered_users
ORDER BY ${sortBy} ${sortOrder}
`.trim()

		const countSql = `
WITH
    latest_users AS (
        SELECT
            id,
            argMax(name, updatedAt) AS name,
            argMax(email, updatedAt) AS email,
            argMax(isActive, updatedAt) AS last_status
        FROM (
            SELECT *
            FROM promocode_analytics.users
            WHERE createdAt >= {dateFrom:DateTime}
              AND createdAt <= {dateTo:DateTime}
        )
        GROUP BY id
    )
SELECT count() AS total
FROM latest_users
WHERE 1=1 ${filterClause}
`.trim()

		return { sql, countSql, params }
	}

	/**
	 * Builds users summary query with proper deduplication
	 */
	static buildUsersSummaryQuery(dateFrom: string, dateTo: string): Omit<QueryResult, 'countSql'> {
		const params: Record<string, unknown> = {
			dateFrom,
			dateTo,
		}

		const sql = `
WITH
    latest_users AS (
        SELECT
            id,
            argMax(isActive, updatedAt) as last_status
        FROM (
            SELECT *
            FROM promocode_analytics.users
            WHERE createdAt >= {dateFrom:DateTime}
              AND createdAt <= {dateTo:DateTime}
        )
        GROUP BY id
    ),
    orders_stats AS (
        SELECT
            sum(amount) as revenue,
            uniq(userId) as unique_users_with_orders
        FROM promocode_analytics.orders
        WHERE userId != ''



        AND createdAt >= {dateFrom:DateTime}
        AND createdAt <= {dateTo:DateTime}



    )
SELECT
    (SELECT uniq(id) FROM latest_users) AS totalUsers,
    (SELECT uniqIf(id, last_status = 1) FROM latest_users) AS activeUsers,
    ifNull(
        (SELECT revenue FROM orders_stats) / nullIf((SELECT unique_users_with_orders FROM orders_stats), 0),
        0
    ) AS averageCheck
`.trim()

		return { sql, params }
	}
}
