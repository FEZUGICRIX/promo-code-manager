import { useState } from 'react'
import { createColumnHelper, type ColumnDef } from '@tanstack/react-table'
import { formatDate, formatCurrency } from '@/shared/lib/formatters'
import { useApplyPromocode } from '@/features/create-order/api/useApplyPromocode'
import type { AnalyticsOrder } from './types'

const col = createColumnHelper<AnalyticsOrder>()

function ApplyPromocodeCell({ orderId }: { orderId: string }) {
	const [open, setOpen] = useState(false)
	const [code, setCode] = useState('')
	const applyPromocode = useApplyPromocode()

	if (!open) {
		return (
			<button
				onClick={() => setOpen(true)}
				className='text-xs text-blue-600 hover:text-blue-800 transition-colors'
			>
				+ Применить
			</button>
		)
	}

	const handleApply = async () => {
		await applyPromocode.mutateAsync({ orderId, promocodeCode: code })
		setOpen(false)
		setCode('')
	}

	return (
		<div className='flex items-center gap-1'>
			<input
				autoFocus
				type='text'
				value={code}
				onChange={(e) => setCode(e.target.value)}
				onKeyDown={(e) => e.key === 'Escape' && setOpen(false)}
				placeholder='Код'
				className='w-24 px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500'
			/>
			<button
				onClick={handleApply}
				disabled={!code.trim() || applyPromocode.isPending}
				className='px-2 py-1 text-xs rounded bg-blue-600 text-white hover:bg-blue-700 disabled:bg-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed transition-colors'
			>
				{applyPromocode.isPending ? '...' : 'OK'}
			</button>
			<button
				onClick={() => {
					setOpen(false)
					setCode('')
				}}
				className='px-2 py-1 text-xs rounded text-gray-500 hover:text-gray-700 transition-colors'
			>
				✕
			</button>
		</div>
	)
}

export const orderColumns: ColumnDef<AnalyticsOrder, any>[] = [
	col.accessor('id', {
		header: 'ID',
		enableSorting: true,
		cell: (info) => (
			<span className='font-mono text-xs text-gray-500'>{info.getValue<string>().slice(-8)}</span>
		),
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
	col.accessor('amount', {
		header: 'Amount',
		enableSorting: true,
		cell: (info) => <span className='text-gray-900'>{formatCurrency(info.getValue())}</span>,
	}),
	col.accessor('discount', {
		header: 'Discount',
		enableSorting: true,
		cell: (info) => (
			<span className='text-gray-900'>{info.getValue() > 0 ? `${info.getValue()}%` : '—'}</span>
		),
	}),
	col.accessor('finalAmount', {
		header: 'Final Amount',
		enableSorting: true,
		cell: (info) => (
			<span className='font-medium text-gray-900'>{formatCurrency(info.getValue())}</span>
		),
	}),
	col.accessor('promocodeCode', {
		header: 'Promocode',
		enableSorting: false,
		cell: (info) => {
			const value = info.getValue()
			if (value) return <span className='text-gray-600'>{value}</span>
			return <ApplyPromocodeCell orderId={info.row.original.id} />
		},
	}),
	col.accessor('createdAt', {
		header: 'Created At',
		enableSorting: true,
		cell: (info) => <span className='text-gray-600'>{formatDate(info.getValue())}</span>,
	}),
]
