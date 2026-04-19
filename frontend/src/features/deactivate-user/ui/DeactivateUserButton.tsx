import { useState } from 'react'
import { X } from 'lucide-react'
import { useDeactivateUser } from '../api/useDeactivateUser'

interface DeactivateUserButtonProps {
	userId: string
}

export function DeactivateUserButton({ userId }: DeactivateUserButtonProps) {
	const [isDialogOpen, setIsDialogOpen] = useState(false)
	const deactivateMutation = useDeactivateUser()

	const handleDeactivate = async () => {
		try {
			await deactivateMutation.mutateAsync(userId)
			setIsDialogOpen(false)
		} catch {
			// Ошибка обработана в mutation
		}
	}

	return (
		<>
			<button
				onClick={(e) => {
					e.stopPropagation()
					setIsDialogOpen(true)
				}}
				className='inline-flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-red-600 hover:text-red-700 hover:bg-red-50 rounded-md transition-colors'
				aria-label='Деактивировать пользователя'
			>
				<X className='w-4 h-4' />
				Деактивировать
			</button>

			{isDialogOpen && (
				<div
					className='fixed inset-0 z-50 flex items-center justify-center bg-black/50'
					onClick={() => setIsDialogOpen(false)}
				>
					<div
						className='bg-white rounded-lg shadow-lg p-6 max-w-md w-full mx-4'
						onClick={(e) => e.stopPropagation()}
					>
						<h2 className='text-lg font-semibold text-gray-900 mb-2'>
							Деактивировать пользователя?
						</h2>
						<p className='text-sm text-gray-600 mb-6'>
							Вы уверены, что хотите деактивировать этого пользователя? Он потеряет доступ к
							системе.
						</p>

						<div className='flex gap-3 justify-end'>
							<button
								onClick={() => setIsDialogOpen(false)}
								className='px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-md transition-colors'
								disabled={deactivateMutation.isPending}
							>
								Отмена
							</button>
							<button
								onClick={handleDeactivate}
								className='px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed'
								disabled={deactivateMutation.isPending}
							>
								{deactivateMutation.isPending ? 'Деактивация...' : 'Деактивировать'}
							</button>
						</div>
					</div>
				</div>
			)}
		</>
	)
}
