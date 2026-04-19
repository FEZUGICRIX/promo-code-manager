import { useState, useEffect } from 'react'
import { DATE_PRESETS, getPresetDates } from '@/shared/lib/date/presets'

/**
 * Props для компонента DateRangePicker
 *
 * **Validates: Requirements 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7, 5.8, 5.10, 5.11**
 */
interface DateRangePickerProps {
	dateFrom?: string
	dateTo?: string
	onChange: (dateFrom: string | undefined, dateTo: string | undefined) => void
}

/**
 * Компонент для выбора диапазона дат с пресетами
 *
 * Предоставляет UI для выбора dateFrom и dateTo с предустановленными диапазонами:
 * - Последние 7 дней
 * - Последние 30 дней
 * - Текущий месяц
 * - Произвольный период (custom)
 *
 * @example
 * ```tsx
 * <DateRangePicker
 *   dateFrom="2024-01-01"
 *   dateTo="2024-01-31"
 *   onChange={(from, to) => console.log(from, to)}
 * />
 * ```
 *
 * **Validates: Requirements 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7, 5.8, 5.10, 5.11**
 */
export function DateRangePicker({ dateFrom, dateTo, onChange }: DateRangePickerProps) {
	const [selectedPreset, setSelectedPreset] = useState<string>(DATE_PRESETS.CUSTOM)
	const [localDateFrom, setLocalDateFrom] = useState<string>(dateFrom || '')
	const [localDateTo, setLocalDateTo] = useState<string>(dateTo || '')
	const [validationError, setValidationError] = useState<string>('')

	// Синхронизация с внешними значениями
	useEffect(() => {
		setLocalDateFrom(dateFrom || '')
		setLocalDateTo(dateTo || '')
	}, [dateFrom, dateTo])

	// Валидация: dateTo >= dateFrom
	useEffect(() => {
		if (localDateFrom && localDateTo && localDateTo < localDateFrom) {
			setValidationError('Дата окончания должна быть больше или равна дате начала')
		} else {
			setValidationError('')
		}
	}, [localDateFrom, localDateTo])

	/**
	 * Обработчик выбора пресета
	 * **Validates: Requirements 5.2, 5.3**
	 */
	const handlePresetChange = (preset: string) => {
		setSelectedPreset(preset)

		if (preset === DATE_PRESETS.CUSTOM) {
			// При выборе "Произвольный период" очищаем даты
			setLocalDateFrom('')
			setLocalDateTo('')
			onChange(undefined, undefined)
		} else {
			// Автоматически устанавливаем даты для выбранного пресета
			const { dateFrom: from, dateTo: to } = getPresetDates(preset)
			setLocalDateFrom(from || '')
			setLocalDateTo(to || '')
			onChange(from, to)
		}
	}

	/**
	 * Обработчик изменения dateFrom
	 * **Validates: Requirements 5.4, 5.5, 5.6, 5.7, 5.8, 5.10**
	 */
	const handleDateFromChange = (value: string) => {
		setLocalDateFrom(value)
		setSelectedPreset(DATE_PRESETS.CUSTOM)

		// Валидация перед вызовом onChange
		if (value && localDateTo && value > localDateTo) {
			return // Не вызываем onChange при невалидных данных
		}

		onChange(value || undefined, localDateTo || undefined)
	}

	/**
	 * Обработчик изменения dateTo
	 * **Validates: Requirements 5.4, 5.5, 5.6, 5.7, 5.8, 5.10**
	 */
	const handleDateToChange = (value: string) => {
		setLocalDateTo(value)
		setSelectedPreset(DATE_PRESETS.CUSTOM)

		// Валидация перед вызовом onChange
		if (value && localDateFrom && value < localDateFrom) {
			return // Не вызываем onChange при невалидных данных
		}

		onChange(localDateFrom || undefined, value || undefined)
	}

	return (
		<div className='space-y-4'>
			{/* Селектор пресетов - Requirements 5.2 */}
			<div className='space-y-2'>
				<label className='block text-sm font-medium text-gray-700'>Период</label>
				<select
					value={selectedPreset}
					onChange={(e) => handlePresetChange(e.target.value)}
					className='w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
				>
					<option value={DATE_PRESETS.LAST_7_DAYS}>Последние 7 дней</option>
					<option value={DATE_PRESETS.LAST_30_DAYS}>Последние 30 дней</option>
					<option value={DATE_PRESETS.CURRENT_MONTH}>Текущий месяц</option>
					<option value={DATE_PRESETS.CUSTOM}>Произвольный период</option>
				</select>
			</div>

			{/* Поля для ручного ввода дат - Requirements 5.4, 5.5 */}
			{selectedPreset === DATE_PRESETS.CUSTOM && (
				<div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
					<div className='space-y-2'>
						<label htmlFor='dateFrom' className='block text-sm font-medium text-gray-700'>
							Дата начала
						</label>
						<input
							id='dateFrom'
							type='date'
							value={localDateFrom}
							onChange={(e) => handleDateFromChange(e.target.value)}
							className='w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
						/>
					</div>

					<div className='space-y-2'>
						<label htmlFor='dateTo' className='block text-sm font-medium text-gray-700'>
							Дата окончания
						</label>
						<input
							id='dateTo'
							type='date'
							value={localDateTo}
							onChange={(e) => handleDateToChange(e.target.value)}
							className='w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
						/>
					</div>
				</div>
			)}

			{/* Сообщение об ошибке валидации - Requirements 5.6, 5.7 */}
			{validationError && (
				<div className='text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2'>
					{validationError}
				</div>
			)}
		</div>
	)
}
