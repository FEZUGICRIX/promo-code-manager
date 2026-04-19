import { createColumnHelper, type ColumnDef } from '@tanstack/react-table'
import { formatDate, formatCurrency } from '@/shared/lib/formatters'
import { UserStatusBadge } from '../ui/UserStatusBadge'
import { DeactivateUserButton } from '@/features/deactivate-user'
import type { AnalyticsUser } from './types'

const col = createColumnHelper<AnalyticsUser>()

/**
 * Column definitions for the UsersAnalyticsTable.
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
export const usersTableColumns: ColumnDef<AnalyticsUser, any>[] = [
	col.accessor('name', {
		header: 'Name',
		enableSorting: true,
		cell: (info) => <span className='font-medium text-gray-900'>{info.getValue()}</span>,
	}),
	col.accessor('email', {
		header: 'Email',
		enableSorting: true,
		cell: (info) => <span className='text-gray-600'>{info.getValue()}</span>,
	}),
	col.accessor('isActive', {
		header: 'Status',
		enableSorting: false,
		cell: (info) => <UserStatusBadge isActive={info.getValue()} />,
	}),
	col.accessor('createdAt', {
		header: 'Registered',
		enableSorting: true,
		cell: (info) => <span className='text-gray-600'>{formatDate(info.getValue())}</span>,
	}),
	col.accessor('totalOrders', {
		header: 'Orders',
		enableSorting: true,
		cell: (info) => <span className='text-gray-900'>{info.getValue()}</span>,
	}),
	col.accessor('totalSpent', {
		header: 'Total Spent',
		enableSorting: true,
		cell: (info) => <span className='text-gray-900'>{formatCurrency(info.getValue())}</span>,
	}),
	col.accessor('promoUsagesCount', {
		header: 'Promo Uses',
		enableSorting: true,
		cell: (info) => <span className='text-gray-900'>{info.getValue()}</span>,
	}),
	col.display({
		id: 'actions',
		header: 'Actions',
		enableSorting: false,
		cell: (info) => {
			if (info.row.original.isActive) {
				return <DeactivateUserButton userId={info.row.original.id} />
			}
			return null
		},
	}),
]
