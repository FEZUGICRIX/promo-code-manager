interface ProgressBarProps {
	current: number
	total: number
}

/**
 * ProgressBar component displays a visual indicator of usage limits with percentage.
 * Color changes based on usage percentage:
 * - Green: < 50%
 * - Yellow: 50-80%
 * - Red: > 80%
 *
 * @param current - Current usage count
 * @param total - Total limit
 *
 * @example
 * ```tsx
 * <ProgressBar current={30} total={100} />
 * <ProgressBar current={100} total={100} />
 * ```
 */
export function ProgressBar({ current, total }: ProgressBarProps) {
	const percentage = (current / total) * 100

	const getColor = (): string => {
		if (percentage >= 80) return 'bg-red-500'
		if (percentage >= 50) return 'bg-yellow-500'
		return 'bg-green-500'
	}

	const isLimitReached = current >= total

	return (
		<div className='space-y-1'>
			<div className='w-full bg-gray-200 rounded-full h-2'>
				<div
					className={`h-2 rounded-full transition-all ${getColor()}`}
					style={{ width: `${Math.min(percentage, 100)}%` }}
				/>
			</div>
			<p className='text-xs text-gray-600'>
				{isLimitReached ? 'Limit reached' : `${current} / ${total}`}
			</p>
		</div>
	)
}
