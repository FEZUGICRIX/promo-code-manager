import { Search, X } from 'lucide-react'
import { useEffect, useState } from 'react'

/**
 * Props для компонента SearchInput
 *
 * **Validates: Requirements 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7**
 */
interface SearchInputProps {
	value: string
	onChange: (value: string) => void
	placeholder?: string
	debounceMs?: number
}

/**
 * Компонент поиска с debounce для аналитических таблиц
 *
 * Предоставляет текстовое поле поиска с:
 * - Debounce для оптимизации запросов (по умолчанию 300ms)
 * - Иконкой поиска слева
 * - Кнопкой очистки справа (когда значение не пустое)
 *
 * @example
 * ```tsx
 * <SearchInput
 *   value={searchQuery}
 *   onChange={(value) => setSearchQuery(value)}
 *   placeholder="Поиск..."
 *   debounceMs={300}
 * />
 * ```
 *
 * **Validates: Requirements 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7**
 */
export function SearchInput({
	value,
	onChange,
	placeholder = 'Поиск...',
	debounceMs = 300,
}: SearchInputProps) {
	// Локальное состояние для немедленного отображения ввода
	const [localValue, setLocalValue] = useState(value)

	// Debounce эффект - вызывает onChange после задержки
	// **Validates: Requirements 4.1, 4.2**
	useEffect(() => {
		const timer = setTimeout(() => {
			onChange(localValue)
		}, debounceMs)

		return () => clearTimeout(timer)
	}, [localValue, debounceMs, onChange])

	// Синхронизация с внешним значением
	useEffect(() => {
		setLocalValue(value)
	}, [value])

	/**
	 * Обработчик очистки поля
	 * **Validates: Requirements 4.5, 4.6**
	 */
	const handleClear = () => {
		setLocalValue('')
		onChange('')
	}

	return (
		<div className='relative'>
			{/* Иконка поиска слева - Requirement 4.3 */}
			<Search className='absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400' />

			{/* Поле ввода - Requirement 4.7 (Tailwind CSS) */}
			<input
				type='text'
				value={localValue}
				onChange={(e) => setLocalValue(e.target.value)}
				placeholder={placeholder}
				className='w-full pl-10 pr-10 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
			/>

			{/* Кнопка очистки справа - Requirements 4.4, 4.5, 4.6 */}
			{localValue && (
				<button
					onClick={handleClear}
					className='absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors'
					aria-label='Очистить поиск'
				>
					<X className='h-4 w-4' />
				</button>
			)}
		</div>
	)
}
