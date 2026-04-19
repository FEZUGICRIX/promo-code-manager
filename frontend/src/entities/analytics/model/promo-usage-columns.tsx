import { createColumnHelper, type ColumnDef } from '@tanstack/react-table'
import { formatDate, formatCurrency } from '@/shared/lib/formatters'
import type { AnalyticsPromoUsage } from './types'

const col = createColumnHelper<AnalyticsPromoUsage>()

/**
 * Column definitions for the PromoUsagesAnalyticsTable.
 * Defined at module scope — stable reference, no useMemo needed.
 *
 * TanStack Table v8 limitation: a mixed-TValue column array cannot be typed as
 * ColumnDef<TData, string | number | boolean>[] because each column's `cell`
 * callback is contravariant in TValue. The idiomatic v8 solution is to
 * annotate the array as ColumnDef<TData, any>[].
 */
export const promoUsageColumns: ColumnDef<AnalyticsPromoUsage, any>[] = [
	col.accessor('createdAt', {
		header: 'Date',
		enableSorting: true,
		cell: (info) => <span className='text-gray-600'>{formatDate(info.getValue())}</span>,
	}),
	col.display({
		id: 'promocode',
		header: 'Promocode',
		enableSorting: true,
		meta: { sortKey: 'promocodeCode' },
		cell: (info) => {
			const { promocodeCode, promocodeDiscount, promocodeDiscountType } = info.row.original
			const symbol = promocodeDiscountType === 'FIXED' ? '₽' : '%'
			return (
				<div>
					<p className='font-medium text-gray-900'>{promocodeCode}</p>
					<p className='text-xs text-gray-500'>
						{promocodeDiscount}
						{symbol}
					</p>
				</div>
			)
		},
	}),
	col.display({
		id: 'user',
		header: 'User',
		enableSorting: false,
		cell: (info) => (
			<div>
				<p className='font-medium text-gray-900'>{info.row.original.userName}</p>
				<p className='text-xs text-gray-500'>{info.row.original.userEmail}</p>
			</div>
		),
	}),
	col.accessor('orderId', {
		header: 'Order ID',
		enableSorting: true,
		cell: (info) => (
			<span className='font-mono text-xs text-gray-500'>{info.getValue<string>().slice(-8)}</span>
		),
	}),
	col.accessor('orderAmount', {
		header: 'Amount Before',
		enableSorting: true,
		cell: (info) => <span className='text-gray-900'>{formatCurrency(info.getValue())}</span>,
	}),
	col.accessor('discountAmount', {
		header: 'Discount Amount',
		enableSorting: true,
		cell: (info) => <span className='text-red-600'>{formatCurrency(info.getValue())}</span>,
	}),
	col.display({
		id: 'amountAfter',
		header: 'Amount After',
		enableSorting: false,
		cell: (info) => {
			const amountAfter = info.row.original.orderAmount - info.row.original.discountAmount
			return <span className='font-medium text-green-700'>{formatCurrency(amountAfter)}</span>
		},
	}),
]
