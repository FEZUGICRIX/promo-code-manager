import { AlertCircle } from 'lucide-react'

interface ErrorStateProps {
	error?: Error | null
	onRetry?: () => void
}

/**
 * ErrorState component displays an error message with an optional retry button.
 *
 * @param error - Error object containing the error message (optional)
 * @param onRetry - Callback function to retry the failed operation (optional)
 *
 * @example
 * ```tsx
 * <ErrorState error={error} onRetry={() => refetch()} />
 * <ErrorState error={new Error('Failed to load')} />
 * ```
 */
export function ErrorState({ error, onRetry }: ErrorStateProps) {
	const message = error?.message || 'Произошла ошибка при загрузке данных'

	return (
		<div className='flex flex-col items-center justify-center py-12 space-y-4'>
			<AlertCircle className='h-12 w-12 text-red-500' />
			<p className='text-gray-600 text-center'>{message}</p>
			{onRetry && (
				<button
					onClick={onRetry}
					className='px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors'
				>
					Повторить попытку
				</button>
			)}
		</div>
	)
}
