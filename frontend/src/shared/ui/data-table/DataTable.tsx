import {
	useReactTable,
	getCoreRowModel,
	ColumnDef,
	flexRender,
	SortingState,
} from '@tanstack/react-table'
import { ChevronDown, ChevronUp } from 'lucide-react'
import { TableSkeleton } from '../skeleton/TableSkeleton'
import { EmptyState } from '../empty-state/EmptyState'
import { ErrorState } from '../error-state/ErrorState'
import { Pagination } from '../pagination/Pagination'

interface DataTableProps<TData> {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	columns: ColumnDef<TData, any>[]
	data: TData[]
	isLoading: boolean
	isError: boolean
	error?: Error | null

	// Пагинация
	pagination: {
		page: number
		pageSize: number
		total: number
	}
	onPaginationChange: (page: number, pageSize: number) => void

	// Сортировка
	sorting?: {
		sortBy: string
		sortOrder: 'ASC' | 'DESC'
	}
	onSortingChange?: (sortBy: string, sortOrder: 'ASC' | 'DESC') => void

	// Дополнительно
	onRetry?: () => void
	emptyMessage?: string
	/** Optional row click handler. When provided, rows show a pointer cursor and hover effect. */
	onRowClick?: (row: TData) => void
	/** Optional filters to display above the table */
	filters?: React.ReactNode
}

/**
 * DataTable is a generic table component with support for pagination, sorting, and various states.
 * It integrates with TanStack Table for table rendering and provides loading, error, and empty states.
 *
 * @template TData - The type of data rows in the table
 *
 * @param columns - Column definitions for TanStack Table
 * @param data - Array of data to display in the table
 * @param isLoading - Whether data is currently loading
 * @param isError - Whether an error occurred during data fetching
 * @param error - Error object (optional)
 * @param pagination - Pagination state (page, pageSize, total)
 * @param onPaginationChange - Callback when pagination changes
 * @param sorting - Current sorting state (sortBy, sortOrder)
 * @param onSortingChange - Callback when sorting changes
 * @param onRetry - Callback to retry failed data fetch
 * @param emptyMessage - Message to display when data is empty
 * @param filters - Optional filters to display above the table
 *
 * @example
 * ```tsx
 * <DataTable
 *   columns={columns}
 *   data={users}
 *   isLoading={isLoading}
 *   isError={isError}
 *   error={error}
 *   pagination={{ page: 1, pageSize: 10, total: 100 }}
 *   onPaginationChange={(page, pageSize) => setParams({ page, pageSize })}
 *   sorting={{ sortBy: 'name', sortOrder: 'ASC' }}
 *   onSortingChange={(sortBy, sortOrder) => setParams({ sortBy, sortOrder })}
 *   onRetry={() => refetch()}
 *   filters={<DateRangeFilter ... />}
 * />
 * ```
 */
export function DataTable<TData>({
	columns,
	data,
	isLoading,
	isError,
	error,
	pagination,
	onPaginationChange,
	sorting,
	onSortingChange,
	onRetry,
	emptyMessage = 'Данные не найдены',
	onRowClick,
	filters,
}: DataTableProps<TData>) {
	// Преобразуем sorting в формат TanStack Table
	const sortingState: SortingState = sorting
		? [
				{
					id: sorting.sortBy,
					desc: sorting.sortOrder === 'DESC',
				},
			]
		: []

	const table = useReactTable({
		data,
		columns,
		getCoreRowModel: getCoreRowModel(),
		manualPagination: true,
		manualSorting: true,
		pageCount: Math.ceil(pagination.total / pagination.pageSize),
		state: {
			pagination: {
				pageIndex: pagination.page - 1,
				pageSize: pagination.pageSize,
			},
			sorting: sortingState,
		},
	})

	// Обработчик клика на заголовок колонки для сортировки
	const handleSort = (columnId: string) => {
		if (!onSortingChange) return

		// Если кликнули на ту же колонку, меняем направление
		if (sorting?.sortBy === columnId) {
			const newOrder = sorting.sortOrder === 'ASC' ? 'DESC' : 'ASC'
			onSortingChange(columnId, newOrder)
		} else {
			// Новая колонка - начинаем с DESC
			onSortingChange(columnId, 'DESC')
		}
	}

	// Обработчики пагинации
	const handlePageChange = (page: number) => {
		onPaginationChange(page, pagination.pageSize)
	}

	const handlePageSizeChange = (pageSize: number) => {
		onPaginationChange(1, pageSize)
	}

	return (
		<div className='space-y-4'>
			{/* Filters - always visible */}
			{filters && <div className='bg-white p-4 rounded-lg border border-gray-200'>{filters}</div>}

			{/* Loading state */}
			{isLoading && <TableSkeleton columns={columns.length} rows={pagination.pageSize} />}

			{/* Error state */}
			{!isLoading && isError && <ErrorState error={error} onRetry={onRetry} />}

			{/* Empty state */}
			{!isLoading && !isError && data.length === 0 && <EmptyState message={emptyMessage} />}

			{/* Table with data */}
			{!isLoading && !isError && data.length > 0 && (
				<>
					<div className='rounded-md border'>
						<table className='w-full'>
							<thead className='bg-gray-50'>
								{table.getHeaderGroups().map((headerGroup) => (
									<tr key={headerGroup.id}>
										{headerGroup.headers.map((header) => {
											const canSort = header.column.getCanSort()
											const isSorted = sorting?.sortBy === header.column.id
											const sortOrder = isSorted ? sorting.sortOrder : null

											return (
												<th
													key={header.id}
													className='px-4 py-3 text-left text-sm font-medium text-gray-700'
												>
													{header.isPlaceholder ? null : (
														<div
															className={`flex items-center gap-2 ${
																canSort && onSortingChange
																	? 'cursor-pointer select-none hover:text-gray-900'
																	: ''
															}`}
															onClick={() => {
																if (canSort && onSortingChange) {
																	handleSort(header.column.id)
																}
															}}
														>
															{flexRender(header.column.columnDef.header, header.getContext())}
															{canSort && onSortingChange && (
																<span className='flex flex-col'>
																	{isSorted && sortOrder === 'ASC' ? (
																		<ChevronUp className='h-4 w-4 text-gray-900' />
																	) : isSorted && sortOrder === 'DESC' ? (
																		<ChevronDown className='h-4 w-4 text-gray-900' />
																	) : (
																		<ChevronDown className='h-4 w-4 text-gray-400' />
																	)}
																</span>
															)}
														</div>
													)}
												</th>
											)
										})}
									</tr>
								))}
							</thead>
							<tbody className='divide-y divide-gray-200 bg-white'>
								{table.getRowModel().rows.map((row) => (
									<tr
										key={row.id}
										className={`hover:bg-gray-50 ${onRowClick ? 'cursor-pointer' : ''}`}
										onClick={() => onRowClick?.(row.original)}
									>
										{row.getVisibleCells().map((cell) => (
											<td key={cell.id} className='px-4 py-3 text-sm text-gray-900'>
												{flexRender(cell.column.columnDef.cell, cell.getContext())}
											</td>
										))}
									</tr>
								))}
							</tbody>
						</table>
					</div>

					{/* Pagination */}
					<Pagination
						page={pagination.page}
						pageSize={pagination.pageSize}
						total={pagination.total}
						onPageChange={handlePageChange}
						onPageSizeChange={handlePageSizeChange}
					/>
				</>
			)}
		</div>
	)
}
