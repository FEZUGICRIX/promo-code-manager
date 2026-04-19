interface UserStatusBadgeProps {
	isActive: boolean
}

/**
 * Displays a coloured pill badge for a user's active/inactive status.
 */
export function UserStatusBadge({ isActive }: UserStatusBadgeProps) {
	return isActive ? (
		<span className='inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800'>
			Active
		</span>
	) : (
		<span className='inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800'>
			Inactive
		</span>
	)
}
