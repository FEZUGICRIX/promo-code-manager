import { useState } from 'react'
import { X } from 'lucide-react'
import { useDeactivatePromocode } from '../api/useDeactivatePromocode'

interface DeactivateButtonProps {
	promocodeId: string
}

/**
 * Кнопка деактивации промокода с диалогом подтверждения
 *
 * Отображается только для активных промокодов.
 * При клике показывает диалог подтверждения перед деактивацией.
 *
 * @param promocodeId - ID промокода для деактивации
 *
 * @example
 * ```tsx
 * <DeactivateButton promocodeId="123" />
 * ```
 *
 * Requirements: 2.1.1, 2.1.2, 2.1.8
 */
export function DeactivateButton({ promocodeId }: DeactivateButtonProps) {
	const [isDialogOpen, setIsDialogOpen] = useState(false)
	const deactivateMutation = useDeactivatePromocode()

	const handleDeactivate = async () => {
		try {
			await deactivateMutation.mutateAsync(promocodeId)
			setIsDialogOpen(false)
		} catch (error) {
			// Ошибка обработана в mutation
		}
	}

	return (
		<>
			{/* Кнопка деактивации (Requirement 2.1.1) */}
			<button
				onClick={(e) => {
					e.stopPropagation()
					setIsDialogOpen(true)
				}}
				className='inline-flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-red-600 hover:text-red-700 hover:bg-red-50 rounded-md transition-colors'
				aria-label='Деактивировать промокод'
			>
				<X className='w-4 h-4' />
				Деактивировать
			</button>

			{/* Диалог подтверждения (Requirement 2.1.2) */}
			{isDialogOpen && (
				<div
					className='fixed inset-0 z-50 flex items-center justify-center bg-black/50'
					onClick={() => setIsDialogOpen(false)}
				>
					<div
						className='bg-white rounded-lg shadow-lg p-6 max-w-md w-full mx-4'
						onClick={(e) => e.stopPropagation()}
					>
						<h2 className='text-lg font-semibold text-gray-900 mb-2'>Деактивировать промокод?</h2>
						<p className='text-sm text-gray-600 mb-6'>
							Вы уверены, что хотите деактивировать этот промокод? Пользователи больше не смогут его
							использовать.
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
