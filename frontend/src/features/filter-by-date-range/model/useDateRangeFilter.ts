import { useState, useCallback } from 'react'
import { DatePreset, type DateRange } from './types'

/**
 * Helper to format date to yyyy-MM-dd
 */
function formatDate(date: Date): string {
	const year = date.getFullYear()
	const month = String(date.getMonth() + 1).padStart(2, '0')
	const day = String(date.getDate()).padStart(2, '0')
	return `${year}-${month}-${day}`
}

/**
 * Get date range based on preset
 */
function getDateRangeForPreset(preset: DatePreset): DateRange {
	const today = new Date()
	today.setHours(0, 0, 0, 0)

	switch (preset) {
		case DatePreset.TODAY:
			return {
				dateFrom: formatDate(today),
				dateTo: formatDate(today),
			}

		case DatePreset.LAST_7_DAYS: {
			const sevenDaysAgo = new Date(today)
			sevenDaysAgo.setDate(today.getDate() - 6)
			return {
				dateFrom: formatDate(sevenDaysAgo),
				dateTo: formatDate(today),
			}
		}

		case DatePreset.LAST_30_DAYS: {
			const thirtyDaysAgo = new Date(today)
			thirtyDaysAgo.setDate(today.getDate() - 29)
			return {
				dateFrom: formatDate(thirtyDaysAgo),
				dateTo: formatDate(today),
			}
		}

		case DatePreset.CUSTOM:
		default:
			return {}
	}
}

/**
 * Hook for managing date range filter state
 */
export function useDateRangeFilter(initialPreset: DatePreset = DatePreset.LAST_30_DAYS) {
	const [preset, setPreset] = useState<DatePreset>(initialPreset)
	const [dateRange, setDateRange] = useState<DateRange>(() => getDateRangeForPreset(initialPreset))

	const handlePresetChange = useCallback((newPreset: DatePreset) => {
		setPreset(newPreset)
		const range = getDateRangeForPreset(newPreset)
		setDateRange(range)
	}, [])

	const handleCustomDateChange = useCallback((range: DateRange) => {
		setPreset(DatePreset.CUSTOM)
		setDateRange(range)
	}, [])

	const reset = useCallback(() => {
		setPreset(initialPreset)
		setDateRange(getDateRangeForPreset(initialPreset))
	}, [initialPreset])

	return {
		preset,
		dateRange,
		handlePresetChange,
		handleCustomDateChange,
		reset,
	}
}
