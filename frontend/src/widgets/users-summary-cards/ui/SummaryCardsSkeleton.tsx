/**
 * SummaryCardsSkeleton displays three animated skeleton cards
 * matching the UsersSummaryCards grid layout while data is loading.
 *
 * @example
 * ```tsx
 * <SummaryCardsSkeleton />
 * ```
 */
export function SummaryCardsSkeleton() {
	return (
		<div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
			{Array.from({ length: 3 }).map((_, index) => (
				<div
					key={index}
					className='bg-white rounded-lg border border-gray-200 p-6 shadow-sm'
					aria-hidden='true'
				>
					<div className='h-4 bg-gray-200 rounded animate-pulse mb-3 w-1/2' />
					<div className='h-8 bg-gray-200 rounded animate-pulse w-3/4' />
				</div>
			))}
		</div>
	)
}
