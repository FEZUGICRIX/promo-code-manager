import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { createOrderSchema } from '../validation'
import { useCreateOrder } from '../api/useCreateOrder'
import { ApplyPromocodeInput } from './ApplyPromocodeInput'

/**
 * Two-step order creation form.
 * Step 1: Enter amount and create order.
 * Step 2: Optionally apply a promocode.
 * Requirements: 1.1, 1.2, 3.2, 3.3, 3.4, 3.5
 */
export function CreateOrderForm() {
	const [createdOrderId, setCreatedOrderId] = useState<string | null>(null)

	const {
		register,
		handleSubmit,
		formState: { errors, isValid },
		reset,
	} = useForm<{ amount: number }>({
		resolver: zodResolver(createOrderSchema),
		mode: 'onChange',
	})

	const createOrder = useCreateOrder()

	const onSubmit = async (data: { amount: number }) => {
		const order = await createOrder.mutateAsync(data)
		setCreatedOrderId(order._id)
		reset()
	}

	if (createdOrderId) {
		return <ApplyPromocodeInput orderId={createdOrderId} onDone={() => setCreatedOrderId(null)} />
	}

	return (
		<form onSubmit={handleSubmit(onSubmit)} className='space-y-4 max-w-sm'>
			<div>
				<label className='block text-sm font-medium text-gray-700 mb-1'>Сумма заказа</label>
				<input
					type='number'
					step='0.01'
					{...register('amount', { valueAsNumber: true })}
					className='w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent'
					placeholder='0.00'
				/>
				{errors.amount && <p className='text-sm text-red-600 mt-1'>{errors.amount.message}</p>}
			</div>
			<button
				type='submit'
				disabled={!isValid || createOrder.isPending}
				className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
					!isValid || createOrder.isPending
						? 'bg-gray-300 text-gray-500 cursor-not-allowed'
						: 'bg-blue-600 text-white hover:bg-blue-700'
				}`}
			>
				{createOrder.isPending ? 'Создание...' : 'Create Order'}
			</button>
		</form>
	)
}
