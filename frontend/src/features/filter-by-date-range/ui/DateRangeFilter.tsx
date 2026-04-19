import { DatePreset, DATE_PRESET_LABELS, type DateRange } from '../model/types'

interface DateRangeFilterProps {
	preset: DatePreset
	dateRange: DateRange
	onPresetChange: (preset: DatePreset) => void
	onCustomDateChange: (range: DateRange) => void
}

/**
 * DateRangeFilter component with preset buttons and custom date inputs
 *
 * @example
 * ```tsx
 * const { preset, dateRange, handlePresetChange, handleCustomDateChange } = useDateRangeFilter()
 * <DateRangeFilter
 *   preset={preset}
 *   dateRange={dateRange}
 *   onPresetChange={handlePresetChange}
 *   onCustomDateChange={handleCustomDateChange}
 * />
 * ```
 */
export function DateRangeFilter({
	preset,
	dateRange,
	onPresetChange,
	onCustomDateChange,
}: DateRangeFilterProps) {
	const presets = [
		DatePreset.TODAY,
		DatePreset.LAST_7_DAYS,
		DatePreset.LAST_30_DAYS,
		DatePreset.CUSTOM,
	]

	const handleDateFromChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		onCustomDateChange({
			...dateRange,
			dateFrom: e.target.value || undefined,
		})
	}

	const handleDateToChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		onCustomDateChange({
			...dateRange,
			dateTo: e.target.value || undefined,
		})
	}

	return (
		<div className='space-y-3'>
			{/* Preset buttons */}
			<div className='flex flex-wrap gap-2'>
				{presets.map((p) => (
					<button
						key={p}
						type='button'
						onClick={() => onPresetChange(p)}
						className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
							preset === p
								? 'bg-blue-600 text-white hover:bg-blue-700'
								: 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
						}`}
					>
						{DATE_PRESET_LABELS[p]}
					</button>
				))}
			</div>

			{/* Custom date inputs */}
			{preset === DatePreset.CUSTOM && (
				<div className='flex flex-col sm:flex-row gap-3'>
					<div className='flex-1'>
						<label htmlFor='dateFrom' className='block text-sm font-medium text-gray-700 mb-1'>
							От
						</label>
						<input
							type='date'
							id='dateFrom'
							value={dateRange.dateFrom || ''}
							onChange={handleDateFromChange}
							className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
						/>
					</div>
					<div className='flex-1'>
						<label htmlFor='dateTo' className='block text-sm font-medium text-gray-700 mb-1'>
							До
						</label>
						<input
							type='date'
							id='dateTo'
							value={dateRange.dateTo || ''}
							onChange={handleDateToChange}
							className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
						/>
					</div>
				</div>
			)}
		</div>
	)
}
