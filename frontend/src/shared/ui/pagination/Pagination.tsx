import { ChevronLeft, ChevronRight } from 'lucide-react'

/**
 * Props для компонента Pagination
 *
 * **Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8**
 */
interface PaginationProps {
	/** Текущая страница (начинается с 1) */
	page: number
	/** Количество элементов на странице */
	pageSize: number
	/** Общее количество элементов */
	total: number
	/** Callback при изменении страницы */
	onPageChange: (page: number) => void
	/** Callback при изменении размера страницы */
	onPageSizeChange: (pageSize: number) => void
	/** Опции для выбора размера страницы */
	pageSizeOptions?: number[]
}

/**
 * Компонент пагинации для таблиц
 *
 * Предоставляет элементы управления для:
 * - Навигации между страницами (кнопки "Предыдущая" и "Следующая")
 * - Отображения информации о текущей странице и общем количестве элементов
 * - Выбора количества элементов на странице
 *
 * @example
 * ```tsx
 * <Pagination
 *   page={1}
 *   pageSize={10}
 *   total={100}
 *   onPageChange={(page) => setPage(page)}
 *   onPageSizeChange={(pageSize) => setPageSize(pageSize)}
 *   pageSizeOptions={[10, 25, 50, 100]}
 * />
 * ```
 *
 * **Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8**
 */
export function Pagination({
	page,
	pageSize,
	total,
	onPageChange,
	onPageSizeChange,
	pageSizeOptions = [10, 25, 50, 100],
}: PaginationProps) {
	const totalPages = Math.ceil(total / pageSize)
	const isFirstPage = page === 1
	const isLastPage = page >= totalPages

	const handlePrevious = () => {
		if (!isFirstPage) {
			onPageChange(page - 1)
		}
	}

	const handleNext = () => {
		if (!isLastPage) {
			onPageChange(page + 1)
		}
	}

	const handlePageSizeChange = (newPageSize: number) => {
		onPageSizeChange(newPageSize)
		onPageChange(1)
	}

	const startItem = total === 0 ? 0 : (page - 1) * pageSize + 1
	const endItem = Math.min(page * pageSize, total)

	return (
		<div className='flex items-center justify-between px-2'>
			<div className='flex items-center gap-6'>
				<div className='text-sm text-gray-700'>
					Показано <span className='font-medium'>{startItem}</span> -{' '}
					<span className='font-medium'>{endItem}</span> из{' '}
					<span className='font-medium'>{total}</span> элементов
				</div>

				<div className='flex items-center gap-2'>
					<label htmlFor='pageSize' className='text-sm text-gray-700'>
						Элементов на странице:
					</label>
					<select
						id='pageSize'
						value={pageSize}
						onChange={(e) => handlePageSizeChange(Number(e.target.value))}
						className='border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500'
					>
						{pageSizeOptions.map((option) => (
							<option key={option} value={option}>
								{option}
							</option>
						))}
					</select>
				</div>
			</div>

			<div className='flex items-center gap-2'>
				<span className='text-sm text-gray-700'>
					Страница {page} из {totalPages || 1}
				</span>

				<div className='flex gap-1'>
					<button
						onClick={handlePrevious}
						disabled={isFirstPage}
						className='inline-flex items-center justify-center rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-gray-100 disabled:pointer-events-none disabled:opacity-50'
						aria-label='Предыдущая страница'
					>
						<ChevronLeft className='h-4 w-4' />
					</button>

					<button
						onClick={handleNext}
						disabled={isLastPage}
						className='inline-flex items-center justify-center rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-gray-100 disabled:pointer-events-none disabled:opacity-50'
						aria-label='Следующая страница'
					>
						<ChevronRight className='h-4 w-4' />
					</button>
				</div>
			</div>
		</div>
	)
}
