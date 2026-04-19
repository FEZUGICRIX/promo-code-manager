/**
 * Date range interface
 */
export interface DateRange {
	dateFrom?: string // ISO date string (yyyy-MM-dd)
	dateTo?: string // ISO date string (yyyy-MM-dd)
}

/**
 * Date preset options
 */
export enum DatePreset {
	TODAY = 'today',
	LAST_7_DAYS = 'last7days',
	LAST_30_DAYS = 'last30days',
	CUSTOM = 'custom',
}

/**
 * Date preset labels
 */
export const DATE_PRESET_LABELS: Record<DatePreset, string> = {
	[DatePreset.TODAY]: 'Сегодня',
	[DatePreset.LAST_7_DAYS]: 'Последние 7 дней',
	[DatePreset.LAST_30_DAYS]: 'Последние 30 дней',
	[DatePreset.CUSTOM]: 'Произвольный',
}
