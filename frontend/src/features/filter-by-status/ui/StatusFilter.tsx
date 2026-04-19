/**
 * Props для компонента StatusFilter
 *
 * **Validates: Requirements 5.2, 5.5**
 */
interface StatusFilterProps {
	value: boolean | undefined
	onChange: (value: boolean | undefined) => void
}

/**
 * Компонент фильтрации пользователей по статусу активности
 *
 * Предоставляет выпадающий список с тремя опциями:
 * - All Users (undefined — без фильтрации)
 * - Active Only (true — только активные)
 * - Inactive Only (false — только неактивные)
 *
 * @example
 * ```tsx
 * <StatusFilter
 *   value={isActive}
 *   onChange={(value) => setIsActive(value)}
 * />
 * ```
 *
 * **Validates: Requirements 5.2, 5.5**
 */
export function StatusFilter({ value, onChange }: StatusFilterProps) {
	const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
		const raw = e.target.value
		if (raw === 'true') onChange(true)
		else if (raw === 'false') onChange(false)
		else onChange(undefined)
	}

	const selectValue = value === true ? 'true' : value === false ? 'false' : 'all'

	return (
		<div className='space-y-2'>
			<label className='block text-sm font-medium text-gray-700'>Статус</label>
			<select
				value={selectValue}
				onChange={handleChange}
				className='w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
			>
				<option value='all'>All Users</option>
				<option value='true'>Active Only</option>
				<option value='false'>Inactive Only</option>
			</select>
		</div>
	)
}
