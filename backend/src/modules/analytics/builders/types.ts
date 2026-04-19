/**
 * Result of a query builder containing SQL, count SQL, and parameters
 */
export interface QueryResult {
	sql: string
	countSql: string
	params: Record<string, unknown>
}

/**
 * Date range for analytics queries
 */
export interface DateRange {
	dateFrom: string
	dateTo: string
}
