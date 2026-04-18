interface TableSkeletonProps {
	columns: number
	rows: number
}

/**
 * TableSkeleton component displays a loading skeleton that mimics a table structure
 * with animated pulse effect while data is being fetched.
 *
 * @param columns - Number of columns to display in the skeleton
 * @param rows - Number of rows to display in the skeleton
 *
 * @example
 * ```tsx
 * <TableSkeleton columns={5} rows={10} />
 * ```
 */
export function TableSkeleton({ columns, rows }: TableSkeletonProps) {
	return (
		<div className='rounded-md border'>
			<table className='w-full'>
				<thead className='bg-gray-50'>
					<tr>
						{Array.from({ length: columns }).map((_, index) => (
							<th key={index} className='px-4 py-3 text-left'>
								<div className='h-4 bg-gray-200 rounded animate-pulse' />
							</th>
						))}
					</tr>
				</thead>
				<tbody className='divide-y divide-gray-200'>
					{Array.from({ length: rows }).map((_, rowIndex) => (
						<tr key={rowIndex}>
							{Array.from({ length: columns }).map((_, colIndex) => (
								<td key={colIndex} className='px-4 py-3'>
									<div className='h-4 bg-gray-200 rounded animate-pulse' />
								</td>
							))}
						</tr>
					))}
				</tbody>
			</table>
		</div>
	)
}
