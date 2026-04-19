import { useState } from 'react'
import { useApplyPromocode } from '../api/useApplyPromocode'

/**
 * Step 2 of the order creation flow.
 * Allows the user to optionally apply a promocode to the created order.
 * Requirements: 2.1, 2.2, 3.6, 3.7
 */
interface ApplyPromocodeInputProps {
	orderId: string
	onDone: () => void
}

export function ApplyPromocodeInput({ orderId, onDone }: ApplyPromocodeInputProps) {
	const [code, setCode] = useState('')
	const applyPromocode = useApplyPromocode()

	const handleApply = async () => {
		await applyPromocode.mutateAsync({ orderId, promocodeCode: code })
		onDone()
	}

	return (
		<div className='space-y-4 max-w-sm'>
			<p className='text-sm text-green-600'>Заказ создан. Хотите применить промокод?</p>
			<div className='flex gap-2'>
				<input
					type='text'
					value={code}
					onChange={(e) => setCode(e.target.value)}
					placeholder='Введите код промокода'
					className='flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent'
				/>
				<button
					type='button'
					onClick={handleApply}
					disabled={!code.trim() || applyPromocode.isPending}
					className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
						!code.trim() || applyPromocode.isPending
							? 'bg-gray-300 text-gray-500 cursor-not-allowed'
							: 'bg-blue-600 text-white hover:bg-blue-700'
					}`}
				>
					{applyPromocode.isPending ? 'Применение...' : 'Apply'}
				</button>
			</div>
			<button
				type='button'
				onClick={onDone}
				className='text-sm text-gray-500 hover:text-gray-700 transition-colors'
			>
				Пропустить
			</button>
		</div>
	)
}
