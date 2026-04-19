import { UsersSummaryCards } from '@/widgets/users-summary-cards'
import { UsersAnalyticsTable } from '@/widgets/users-analytics-table'

export function UsersIntelligencePage() {
	return (
		<div className='space-y-6'>
			<h1 className='text-2xl font-semibold'>Users Intelligence Dashboard</h1>
			<UsersSummaryCards />
			<UsersAnalyticsTable />
		</div>
	)
}
