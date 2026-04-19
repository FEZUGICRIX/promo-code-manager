import { PromoUsagesAnalyticsTable } from '@/widgets/promo-usages-analytics-table'

export function PromoUsagesPage() {
	return (
		<div className='space-y-4'>
			<h1 className='text-2xl font-semibold'>История использований</h1>
			<PromoUsagesAnalyticsTable />
		</div>
	)
}
