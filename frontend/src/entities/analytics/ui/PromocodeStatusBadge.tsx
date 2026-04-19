interface PromocodeStatusBadgeProps {
	isActive: boolean
}

/**
 * Displays a coloured pill badge for a promocode's active/inactive status.
 * Green for Active, Gray for Inactive.
 */
export function PromocodeStatusBadge({ isActive }: PromocodeStatusBadgeProps) {
	return isActive ? (
		<span className='inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800'>
			Active
		</span>
	) : (
		<span className='inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800'>
			Inactive
		</span>
	)
}
