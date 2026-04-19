import { CreateOrderForm } from '@/features/create-order'
import { OrdersAnalyticsTable } from '@/widgets/orders-analytics-table'

export function OrdersPage() {
	return (
		<div className='space-y-6'>
			<div className='flex justify-between items-center'>
				<h1 className='text-2xl font-semibold'>Заказы</h1>
			</div>
			<CreateOrderForm />
			<OrdersAnalyticsTable />
		</div>
	)
}
