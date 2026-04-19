import { DateRange } from '../builders/types'

/**
 * Helper class for resolving date ranges
 * Provides default 30-day range if not specified
 */
export class DateRangeHelper {
	/**
	 * Resolves date range with default to last 30 days
	 * Formats dates for ClickHouse DateTime type
	 *
	 * If dateFrom is provided as date-only (yyyy-MM-dd), sets time to 00:00:00
	 * If dateTo is provided as date-only (yyyy-MM-dd), sets time to 23:59:59
	 */
	static resolveDateRange(dateFrom?: string, dateTo?: string): DateRange {
		const now = new Date()
		const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

		let resolvedDateFrom: string
		let resolvedDateTo: string

		if (dateFrom) {
			// If date-only format (yyyy-MM-dd), add start of day time
			if (/^\d{4}-\d{2}-\d{2}$/.test(dateFrom)) {
				resolvedDateFrom = `${dateFrom} 00:00:00`
			} else {
				resolvedDateFrom = dateFrom
			}
		} else {
			resolvedDateFrom = thirtyDaysAgo.toISOString().slice(0, 19).replace('T', ' ')
		}

		if (dateTo) {
			// If date-only format (yyyy-MM-dd), add end of day time
			if (/^\d{4}-\d{2}-\d{2}$/.test(dateTo)) {
				resolvedDateTo = `${dateTo} 23:59:59`
			} else {
				resolvedDateTo = dateTo
			}
		} else {
			resolvedDateTo = now.toISOString().slice(0, 19).replace('T', ' ')
		}

		return {
			dateFrom: resolvedDateFrom,
			dateTo: resolvedDateTo,
		}
	}
}
