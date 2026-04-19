import { useCallback } from 'react'
import { DataTable } from '@/shared/ui/data-table/DataTable'
import { SearchInput } from '@/features/search-analytics'
import { StatusFilter } from '@/features/filter-by-status'
import { DateRangeFilter, useDateRangeFilter, DatePreset } from '@/features/filter-by-date-range'
import { useAnalyticsParams } from '@/widgets/analytics-table'
import { usePromocodesAnalytics, SortOrder, promocodeColumns } from '@/entities/analytics'
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

	const formatDate = (date: Date) => {
		const year = date.getFullYear()
		const month = String(date.getMonth() + 1).padStart(2, '0')
		const day = String(date.getDate()).padStart(2, '0')
		return `${year}-${month}-${day}`
	}

	return {
		dateFrom: formatDate(thirtyDaysAgo),
		dateTo: formatDate(today),
	}
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

// ─── Props ────────────────────────────────────────────────────────────────────

interface PromocodesAnalyticsTableProps {
	/** Called when a row is clicked — used to open the edit form */
	onRowClick?: (promocode: AnalyticsPromocode) => void
}

// ─── Component ────────────────────────────────────────────────────────────────

/**
 * PromocodesAnalyticsTable displays a paginated, sortable, searchable table of
 * promocodes with analytics columns (revenue, usage, unique users).
 *
 * @example
 * ```tsx
 * <PromocodesAnalyticsTable onRowClick={(p) => openEditForm(p)} />
 * ```
 */
export function PromocodesAnalyticsTable({ onRowClick }: PromocodesAnalyticsTableProps) {
	const { params, setParams } = useAnalyticsParams<PromocodesAnalyticsParams>(DEFAULT_PARAMS)
	const { data, isLoading, isError, error, refetch } = usePromocodesAnalytics(params)

	// Date range filter
	const { preset, dateRange, handlePresetChange, handleCustomDateChange } = useDateRangeFilter(
		DatePreset.LAST_30_DAYS,
	)

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

	// Handle date range changes
	const handleDatePresetChange = useCallback(
		(newPreset: DatePreset) => {
			handlePresetChange(newPreset)
			// Get the new date range for the preset
			const today = new Date()
			today.setHours(0, 0, 0, 0)

			const formatDate = (date: Date) => {
				const year = date.getFullYear()
				const month = String(date.getMonth() + 1).padStart(2, '0')
				const day = String(date.getDate()).padStart(2, '0')
				return `${year}-${month}-${day}`
			}

			let newDateFrom: string | undefined
			let newDateTo: string | undefined

			if (newPreset === DatePreset.TODAY) {
				newDateFrom = formatDate(today)
				newDateTo = formatDate(today)
			} else if (newPreset === DatePreset.LAST_7_DAYS) {
				const sevenDaysAgo = new Date(today)
				sevenDaysAgo.setDate(today.getDate() - 6)
				newDateFrom = formatDate(sevenDaysAgo)
				newDateTo = formatDate(today)
			} else if (newPreset === DatePreset.LAST_30_DAYS) {
				const thirtyDaysAgo = new Date(today)
				thirtyDaysAgo.setDate(today.getDate() - 29)
				newDateFrom = formatDate(thirtyDaysAgo)
				newDateTo = formatDate(today)
			}

			setParams({
				dateFrom: newDateFrom,
				dateTo: newDateTo,
				page: 1,
			})
		},
		[handlePresetChange, setParams],
	)

	const handleDateCustomChange = useCallback(
		(range: { dateFrom?: string; dateTo?: string }) => {
			handleCustomDateChange(range)
			setParams({
				dateFrom: range.dateFrom,
				dateTo: range.dateTo,
				page: 1,
			})
		},
		[handleCustomDateChange, setParams],
	)

	const normalizedError =
		error instanceof Error ? error : error != null ? new Error(String(error)) : null

	return (
		<div className='space-y-4'>
			{/* Search and Status Filters */}
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

			{/* Table with Date Range Filter */}
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
				onRowClick={onRowClick}
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
	)
}
