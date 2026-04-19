import { useCallback } from 'react'
import { DataTable } from '@/shared/ui/data-table/DataTable'
import { SearchInput } from '@/features/search-analytics'
import { DateRangeFilter, useDateRangeFilter, DatePreset } from '@/features/filter-by-date-range'
import { useAnalyticsParams } from '@/widgets/analytics-table'
import { usePromoUsagesAnalytics, SortOrder, promoUsageColumns } from '@/entities/analytics'
import { formatDate } from '@/shared/lib/formatters'
import type {
	AnalyticsPromoUsage,
	PromoUsagesAnalyticsParams,
	PromoUsagesSortColumn,
} from '@/entities/analytics'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getInitialDateRange() {
	const today = new Date()
	today.setHours(0, 0, 0, 0)
	const thirtyDaysAgo = new Date(today)
	thirtyDaysAgo.setDate(today.getDate() - 29)

	const fmt = (date: Date) => {
		const year = date.getFullYear()
		const month = String(date.getMonth() + 1).padStart(2, '0')
		const day = String(date.getDate()).padStart(2, '0')
		return `${year}-${month}-${day}`
	}

	return { dateFrom: fmt(thirtyDaysAgo), dateTo: fmt(today) }
}

function getDeepLinkSearch(): string | undefined {
	const sp = new URLSearchParams(window.location.search)
	return sp.get('promocodeCode') ?? sp.get('search') ?? undefined
}

// ─── CSV Export ───────────────────────────────────────────────────────────────

function exportToCsv(data: AnalyticsPromoUsage[], dateFrom?: string, dateTo?: string) {
	const BOM = '\uFEFF'
	const headers = [
		'Date',
		'Promocode',
		'Discount%',
		'User Name',
		'User Email',
		'Order ID',
		'Amount Before',
		'Discount Amount',
		'Amount After',
	]

	const rows = data.map((row) => [
		formatDate(row.createdAt),
		row.promocodeCode,
		row.promocodeDiscount,
		row.userName,
		row.userEmail,
		row.orderId,
		row.orderAmount,
		row.discountAmount,
		(row.orderAmount - row.discountAmount).toFixed(2),
	])

	const csv =
		BOM +
		[headers, ...rows]
			.map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(','))
			.join('\n')

	const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
	const url = URL.createObjectURL(blob)
	const link = document.createElement('a')
	link.href = url
	link.download = `promo-usages-${dateFrom ?? 'all'}-${dateTo ?? 'all'}.csv`
	link.click()
	URL.revokeObjectURL(url)
}

// ─── Constants ────────────────────────────────────────────────────────────────

const initialDateRange = getInitialDateRange()

const DEFAULT_PARAMS: PromoUsagesAnalyticsParams = {
	page: 1,
	pageSize: 10,
	sortBy: 'createdAt',
	sortOrder: SortOrder.DESC,
	...initialDateRange,
	search: getDeepLinkSearch(),
}

// ─── Component ────────────────────────────────────────────────────────────────

/**
 * PromoUsagesAnalyticsTable displays a paginated, sortable, searchable table
 * of promo usage events with CSV export and deep-link filtering support.
 */
export function PromoUsagesAnalyticsTable() {
	const { params, setParams } = useAnalyticsParams<PromoUsagesAnalyticsParams>(DEFAULT_PARAMS)
	const { data, isLoading, isError, error, refetch } = usePromoUsagesAnalytics(params)

	const { preset, dateRange, handlePresetChange, handleCustomDateChange } = useDateRangeFilter(
		DatePreset.LAST_30_DAYS,
	)

	const handleSearchChange = useCallback(
		(search: string) => {
			setParams({ search: search || undefined, page: 1 })
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
			setParams({ sortBy: sortBy as PromoUsagesSortColumn, sortOrder: sortOrder as SortOrder })
		},
		[setParams],
	)

	const handleDatePresetChange = useCallback(
		(newPreset: DatePreset) => {
			handlePresetChange(newPreset)

			const today = new Date()
			today.setHours(0, 0, 0, 0)

			const fmt = (date: Date) => {
				const year = date.getFullYear()
				const month = String(date.getMonth() + 1).padStart(2, '0')
				const day = String(date.getDate()).padStart(2, '0')
				return `${year}-${month}-${day}`
			}

			let newDateFrom: string | undefined
			let newDateTo: string | undefined

			if (newPreset === DatePreset.TODAY) {
				newDateFrom = fmt(today)
				newDateTo = fmt(today)
			} else if (newPreset === DatePreset.LAST_7_DAYS) {
				const sevenDaysAgo = new Date(today)
				sevenDaysAgo.setDate(today.getDate() - 6)
				newDateFrom = fmt(sevenDaysAgo)
				newDateTo = fmt(today)
			} else if (newPreset === DatePreset.LAST_30_DAYS) {
				const thirtyDaysAgo = new Date(today)
				thirtyDaysAgo.setDate(today.getDate() - 29)
				newDateFrom = fmt(thirtyDaysAgo)
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

	const handleExportCsv = useCallback(() => {
		if (!data?.data?.length) return
		exportToCsv(data.data, params.dateFrom, params.dateTo)
	}, [data, params.dateFrom, params.dateTo])

	const normalizedError =
		error instanceof Error ? error : error != null ? new Error(String(error)) : null

	return (
		<div className='space-y-4'>
			<div className='flex flex-col md:flex-row gap-4 items-start md:items-center justify-between'>
				<div className='w-full md:w-96'>
					<SearchInput
						value={params.search ?? ''}
						onChange={handleSearchChange}
						placeholder='Search by promocode or user...'
						debounceMs={300}
					/>
				</div>
				<button
					onClick={handleExportCsv}
					disabled={!data?.data?.length || isLoading}
					className='inline-flex items-center px-3 py-1.5 text-sm border border-input rounded-md bg-background hover:bg-accent hover:text-accent-foreground disabled:opacity-50 disabled:pointer-events-none'
				>
					Export CSV
				</button>
			</div>

			<DataTable<AnalyticsPromoUsage>
				columns={promoUsageColumns}
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
				emptyMessage='История использований не найдена'
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
