import { subDays, startOfMonth, endOfMonth, format } from 'date-fns'

/**
 * Enum для предустановленных диапазонов дат
 */
export enum DATE_PRESETS {
	LAST_7_DAYS = 'last_7_days',
	LAST_30_DAYS = 'last_30_days',
	CURRENT_MONTH = 'current_month',
	CUSTOM = 'custom',
}

/**
 * Результат функции getPresetDates
 */
export interface PresetDatesResult {
	dateFrom?: string
	dateTo?: string
}

/**
 * Получить диапазон дат для выбранного пресета
 *
 * @param preset - Выбранный пресет из DATE_PRESETS
 * @returns Объект с dateFrom и dateTo в формате ISO string (yyyy-MM-dd)
 *
 * @example
 * ```typescript
 * const { dateFrom, dateTo } = getPresetDates(DATE_PRESETS.LAST_7_DAYS)
 * // dateFrom: "2024-01-08", dateTo: "2024-01-15"
 * ```
 */
export function getPresetDates(preset: DATE_PRESETS | string): PresetDatesResult {
	const today = new Date()

	switch (preset) {
		case DATE_PRESETS.LAST_7_DAYS:
			return {
				dateFrom: format(subDays(today, 7), 'yyyy-MM-dd'),
				dateTo: format(today, 'yyyy-MM-dd'),
			}

		case DATE_PRESETS.LAST_30_DAYS:
			return {
				dateFrom: format(subDays(today, 30), 'yyyy-MM-dd'),
				dateTo: format(today, 'yyyy-MM-dd'),
			}

		case DATE_PRESETS.CURRENT_MONTH:
			return {
				dateFrom: format(startOfMonth(today), 'yyyy-MM-dd'),
				dateTo: format(endOfMonth(today), 'yyyy-MM-dd'),
			}

		case DATE_PRESETS.CUSTOM:
		default:
			return {
				dateFrom: undefined,
				dateTo: undefined,
			}
	}
}
