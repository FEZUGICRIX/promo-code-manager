import { SummaryCard } from '@/shared/ui/summary-card/SummaryCard'
import { ErrorState } from '@/shared/ui/error-state/ErrorState'
import { useUsersSummary } from '@/entities/analytics/api/hooks/useUsersSummary'
import { SummaryCardsSkeleton } from './SummaryCardsSkeleton'

/**
 * UsersSummaryCards widget displays three summary metric cards:
 * Total Users, Active Users, and Average Check.
 *
 * Handles loading state with skeleton cards and error state with retry button.
 * Responsive grid: 1 column on mobile, 3 columns on desktop.
 *
 * @example
 * ```tsx
 * <UsersSummaryCards />
 * ```
 */
export function UsersSummaryCards() {
	const { data, isLoading, isError, error, refetch } = useUsersSummary()

	if (isLoading) return <SummaryCardsSkeleton />

	if (isError) {
		return (
			<ErrorState
				error={error instanceof Error ? error : new Error('Не удалось загрузить метрики')}
				onRetry={refetch}
			/>
		)
	}

	return (
		<div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
			<SummaryCard title='Всего пользователей' value={data?.totalUsers ?? 0} />
			<SummaryCard title='Активные пользователи' value={data?.activeUsers ?? 0} />
			<SummaryCard title='Средний чек' value={data?.averageCheck ?? 0} format='currency' />
		</div>
	)
}
