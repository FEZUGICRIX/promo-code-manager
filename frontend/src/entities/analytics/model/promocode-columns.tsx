import { createColumnHelper, type ColumnDef } from '@tanstack/react-table'
import { formatDate, formatCurrency } from '@/shared/lib/formatters'
import { ProgressBar } from '@/shared/ui/progress-bar/ProgressBar'
import { PromocodeStatusBadge } from '../ui/PromocodeStatusBadge'
import { DeactivateButton } from '@/features/deactivate-promocode'
import type { AnalyticsPromocode } from './types'

const col = createColumnHelper<AnalyticsPromocode>()

/**
 * Column definitions for the PromocodesAnalyticsTable.
 * Defined at module scope — stable reference, no useMemo needed.
 *
 * TanStack Table v8 limitation: a mixed-TValue column array cannot be typed as
 * ColumnDef<TData, string | number | boolean>[] because each column's `cell`
 * callback is contravariant in TValue. The idiomatic v8 solution (confirmed by
 * the library authors and addressed in v9 via columnHelper.columns()) is to
 * annotate the array as ColumnDef<TData, any>[]. The `any` is scoped only to
 * the array boundary — inside each column definition createColumnHelper still
 * infers the concrete TValue, so info.getValue() is fully typed.
 */
export const promocodeColumns: ColumnDef<AnalyticsPromocode, any>[] = [
	col.accessor('code', {
		header: 'Code',
		enableSorting: true,
		cell: (info) => <span className='font-medium text-gray-900'>{info.getValue()}</span>,
	}),
	col.accessor('discount', {
		header: 'Discount',
		enableSorting: true,
		cell: (info) => {
			const { discount, discountType } = info.row.original
			const symbol = discountType === 'FIXED' ? '₽' : '%'
			return (
				<span className='text-gray-900'>
					{discount}
					{symbol}
				</span>
			)
		},
	}),
	col.display({
		id: 'limits',
		header: 'Limits',
		enableSorting: false,
		cell: (info) => (
			<ProgressBar current={info.row.original.usageCount} total={info.row.original.totalLimit} />
		),
	}),
	col.accessor('totalRevenue', {
		header: 'Revenue',
		enableSorting: true,
		cell: (info) => <span className='text-gray-900'>{formatCurrency(info.getValue())}</span>,
	}),
	col.accessor('uniqueUsers', {
		header: 'Unique Users',
		enableSorting: true,
		cell: (info) => <span className='text-gray-900'>{info.getValue()}</span>,
	}),
	col.accessor('totalDiscount', {
		header: 'Total Discount',
		enableSorting: true,
		cell: (info) => <span className='text-gray-900'>{formatCurrency(info.getValue())}</span>,
	}),
	col.accessor('isActive', {
		header: 'Status',
		enableSorting: false,
		cell: (info) => <PromocodeStatusBadge isActive={info.getValue()} />,
	}),
	col.display({
		id: 'expiration',
		header: 'Expiration',
		enableSorting: false,
		cell: (info) => {
			const expiration = info.row.original.dateTo
			return <span className='text-gray-600'>{expiration ? formatDate(expiration) : 'N/A'}</span>
		},
	}),
	col.display({
		id: 'actions',
		header: 'Actions',
		enableSorting: false,
		cell: (info) => {
			// Отображать кнопку деактивации только для активных промокодов (Requirement 2.1.8)
			if (info.row.original.isActive) {
				return <DeactivateButton promocodeId={info.row.original.id} />
			}
			return null
		},
	}),
]
