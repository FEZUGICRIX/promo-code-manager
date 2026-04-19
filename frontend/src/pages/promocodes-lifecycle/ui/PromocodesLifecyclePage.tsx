import { useCallback, useState } from 'react'
import { DataTable } from '@/shared/ui/data-table/DataTable'
import { SearchInput } from '@/features/search-analytics'
import { StatusFilter } from '@/features/filter-by-status'
import { DateRangeFilter, useDateRangeFilter, DatePreset } from '@/features/filter-by-date-range'
import { useAnalyticsParams } from '@/widgets/analytics-table'
import { usePromocodesAnalytics, SortOrder, promocodeColumns } from '@/entities/analytics'
import { PromocodeForm } from '@/widgets/promocode-form'
import type {
	AnalyticsPromocode,
	PromocodesAnalyticsParams,
	PromocodesSortColumn,
} from '@/entities/analytics'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getInitialDateRange() {
	const today = new Date()
	today.setHours(0, 0, 0, 0)
	const thirtyDaysAgo = new Date(today)
	thirtyDaysAgo.setDate(today.getDate() - 29)

	const fmt = (d: Date) => {
		const y = d.getFullYear()
		const m = String(d.getMonth() + 1).padStart(2, '0')
		const day = String(d.getDate()).padStart(2, '0')
		return `${y}-${m}-${day}`
	}

	return { dateFrom: fmt(thirtyDaysAgo), dateTo: fmt(today) }
}

// ─── Constants ────────────────────────────────────────────────────────────────

const initialDateRange = getInitialDateRange()

const DEFAULT_PARAMS: PromocodesAnalyticsParams = {
	page: 1,
	pageSize: 10,
	sortBy: 'createdAt',
	sortOrder: SortOrder.DESC,
	...initialDateRange,
}

// ─── Component ────────────────────────────────────────────────────────────────

/**
 * PromocodesLifecyclePage — main page for managing promocodes and monitoring performance.
 *
 * Composes:
 * - PromocodeForm modal for create / edit
 * - DataTable with promocodeColumns (ProgressBar, StatusBadge, DeactivateButton)
 * - SearchInput, StatusFilter, DateRangeFilter with presets
 *
 * Requirements: 1.1, 2.1, 4.9, 9.1, 9.1.1–9.1.3, 14.1–14.4
 */
export function PromocodesLifecyclePage() {
	// ── Form state ──────────────────────────────────────────────────────────
	const [isFormOpen, setIsFormOpen] = useState(false)
	const [editingPromocode, setEditingPromocode] = useState<AnalyticsPromocode | null>(null)

	// ── Table params (URL-synced) ────────────────────────────────────────────
	const { params, setParams } = useAnalyticsParams<PromocodesAnalyticsParams>(DEFAULT_PARAMS)

	// ── Data ────────────────────────────────────────────────────────────────
	const { data, isLoading, isError, error, refetch } = usePromocodesAnalytics(params)

	// ── Date range filter ────────────────────────────────────────────────────
	const { preset, dateRange, handlePresetChange, handleCustomDateChange } = useDateRangeFilter(
		DatePreset.LAST_30_DAYS,
	)

	// ── Handlers ────────────────────────────────────────────────────────────

	const handleCreate = useCallback(() => {
		setEditingPromocode(null)
		setIsFormOpen(true)
	}, [])

	const handleRowClick = useCallback((promocode: AnalyticsPromocode) => {
		setEditingPromocode(promocode)
		setIsFormOpen(true)
	}, [])

	const handleFormSuccess = useCallback(() => {
		setIsFormOpen(false)
		setEditingPromocode(null)
	}, [])

	const handleFormCancel = useCallback(() => {
		setIsFormOpen(false)
		setEditingPromocode(null)
	}, [])

	const handleSearchChange = useCallback(
		(search: string) => {
			setParams({ search: search || undefined, page: 1 })
		},
		[setParams],
	)

	const handleStatusChange = useCallback(
		(isActive: boolean | undefined) => {
			setParams({ isActive, page: 1 })
		},
		[setParams],
	)

	const handlePaginationChange = useCallback(
		(page: number, pageSize: number) => {
			setParams({ page, pageSize })
		},
		[setParams],
	)

	const handleSortingChange = useCallback(
		(sortBy: string, sortOrder: 'ASC' | 'DESC') => {
			setParams({ sortBy: sortBy as PromocodesSortColumn, sortOrder: sortOrder as SortOrder })
		},
		[setParams],
	)

	const handleDatePresetChange = useCallback(
		(newPreset: DatePreset) => {
			handlePresetChange(newPreset)

			const today = new Date()
			today.setHours(0, 0, 0, 0)
			const fmt = (d: Date) => {
				const y = d.getFullYear()
				const m = String(d.getMonth() + 1).padStart(2, '0')
				const day = String(d.getDate()).padStart(2, '0')
				return `${y}-${m}-${day}`
			}

			let newDateFrom: string | undefined
			let newDateTo: string | undefined

			if (newPreset === DatePreset.TODAY) {
				newDateFrom = fmt(today)
				newDateTo = fmt(today)
			} else if (newPreset === DatePreset.LAST_7_DAYS) {
				const d = new Date(today)
				d.setDate(today.getDate() - 6)
				newDateFrom = fmt(d)
				newDateTo = fmt(today)
			} else if (newPreset === DatePreset.LAST_30_DAYS) {
				const d = new Date(today)
				d.setDate(today.getDate() - 29)
				newDateFrom = fmt(d)
				newDateTo = fmt(today)
			}

			setParams({ dateFrom: newDateFrom, dateTo: newDateTo, page: 1 })
		},
		[handlePresetChange, setParams],
	)

	const handleDateCustomChange = useCallback(
		(range: { dateFrom?: string; dateTo?: string }) => {
			handleCustomDateChange(range)
			setParams({ dateFrom: range.dateFrom, dateTo: range.dateTo, page: 1 })
		},
		[handleCustomDateChange, setParams],
	)

	const normalizedError =
		error instanceof Error ? error : error != null ? new Error(String(error)) : null

	return (
		<div className='space-y-6'>
			{/* ── Header ── */}
			<div className='flex items-center justify-between'>
				<h1 className='text-2xl font-semibold'>Promocodes Lifecycle &amp; Performance</h1>
				<button
					onClick={handleCreate}
					className='px-4 py-2 bg-blue-600 text-white rounded-md font-medium hover:bg-blue-700 transition-colors'
				>
					Create Promocode
				</button>
			</div>

			{/* ── Table ── */}
			<div className='space-y-4'>
				{/* Search + Status filters */}
				<div className='flex flex-col md:flex-row gap-4'>
					<div className='w-full md:w-96'>
						<SearchInput
							value={params.search ?? ''}
							onChange={handleSearchChange}
							placeholder='Search by code...'
							debounceMs={300}
						/>
					</div>
					<div className='w-full md:w-48'>
						<StatusFilter value={params.isActive} onChange={handleStatusChange} />
					</div>
				</div>

				{/* DataTable with DateRangeFilter */}
				<DataTable<AnalyticsPromocode>
					columns={promocodeColumns}
					data={data?.data ?? []}
					isLoading={isLoading}
					isError={isError}
					error={normalizedError}
					pagination={{
						page: params.page,
						pageSize: params.pageSize,
						total: data?.total ?? 0,
					}}
					onPaginationChange={handlePaginationChange}
					sorting={{
						sortBy: params.sortBy,
						sortOrder: params.sortOrder,
					}}
					onSortingChange={handleSortingChange}
					onRetry={refetch}
					emptyMessage='No promocodes found'
					onRowClick={handleRowClick}
					filters={
						<DateRangeFilter
							preset={preset}
							dateRange={dateRange}
							onPresetChange={handleDatePresetChange}
							onCustomDateChange={handleDateCustomChange}
						/>
					}
				/>
			</div>

			{/* ── Form Modal ── */}
			{isFormOpen && (
				<div className='fixed inset-0 z-50 flex items-center justify-center bg-black/50'>
					<div className='bg-white rounded-lg shadow-xl w-full max-w-lg mx-4 p-6 max-h-[90vh] overflow-y-auto'>
						<PromocodeForm
							promocode={editingPromocode}
							onSuccess={handleFormSuccess}
							onCancel={handleFormCancel}
						/>
					</div>
				</div>
			)}
		</div>
	)
}
