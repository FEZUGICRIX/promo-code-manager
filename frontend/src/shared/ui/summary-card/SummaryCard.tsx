import { ReactNode } from 'react'

interface SummaryCardProps {
	title: string
	value: number
	format?: 'number' | 'currency'
	icon?: ReactNode
}

/**
 * SummaryCard component displays a metric card with title, value, and optional icon.
 * Supports number and currency formatting.
 *
 * @param title - The title/label for the metric
 * @param value - The numeric value to display
 * @param format - Format type: 'number' (default) or 'currency'
 * @param icon - Optional icon element to display
 *
 * @example
 * ```tsx
 * <SummaryCard title="Total Users" value={1234} />
 * <SummaryCard title="Average Check" value={45.67} format="currency" />
 * <SummaryCard title="Active Users" value={890} icon={<Users />} />
 * ```
 */
export function SummaryCard({ title, value, format = 'number', icon }: SummaryCardProps) {
	const formatValue = (val: number): string => {
		if (format === 'currency') {
			return new Intl.NumberFormat('ru-RU', {
				style: 'currency',
				currency: 'RUB',
				minimumFractionDigits: 2,
				maximumFractionDigits: 2,
			}).format(val)
		}

		return new Intl.NumberFormat('ru-RU').format(val)
	}

	return (
		<div className='bg-white rounded-lg border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow'>
			<div className='flex items-start justify-between'>
				<div className='flex-1'>
					<p className='text-sm font-medium text-gray-600 mb-2'>{title}</p>
					<p className='text-2xl font-bold text-gray-900'>{formatValue(value)}</p>
				</div>
				{icon && <div className='text-gray-400 ml-4'>{icon}</div>}
			</div>
		</div>
	)
}
