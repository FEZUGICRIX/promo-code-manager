import { IsOptional, IsIn } from 'class-validator'
import { AnalyticsQueryDTO } from './analytics-query.dto'

export const ORDERS_SORT_COLUMNS = ['id', 'amount', 'discount', 'finalAmount', 'createdAt'] as const

export class OrdersQueryDTO extends AnalyticsQueryDTO {
	@IsOptional()
	@IsIn(ORDERS_SORT_COLUMNS)
	sortBy?: (typeof ORDERS_SORT_COLUMNS)[number] = 'createdAt'
}
