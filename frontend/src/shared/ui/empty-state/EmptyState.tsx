import { Inbox, LucideIcon } from 'lucide-react'

interface EmptyStateProps {
	message: string
	icon?: LucideIcon
}

/**
 * EmptyState component displays a centered message with an icon when no data is available.
 *
 * @param message - The message to display to the user
 * @param icon - Optional Lucide icon component (defaults to Inbox)
 *
 * @example
 * ```tsx
 * <EmptyState message="Данные не найдены" />
 * <EmptyState message="Нет результатов" icon={Search} />
 * ```
 */
export function EmptyState({ message, icon: Icon = Inbox }: EmptyStateProps) {
	return (
		<div className='flex flex-col items-center justify-center py-12 space-y-4'>
			<Icon className='h-12 w-12 text-gray-400' />
			<p className='text-gray-600 text-center'>{message}</p>
		</div>
	)
}
