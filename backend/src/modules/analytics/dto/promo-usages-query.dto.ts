import { IsOptional, IsIn } from 'class-validator'
import { AnalyticsQueryDTO } from './analytics-query.dto'

export const PROMO_USAGES_SORT_COLUMNS = [
	'id',
	'promocodeCode',
	'promocodeDiscount',
	'userName',
	'userEmail',
	'orderId',
	'orderAmount',
	'discountAmount',
	'createdAt',
] as const

export class PromoUsagesQueryDTO extends AnalyticsQueryDTO {
	@IsOptional()
	@IsIn(PROMO_USAGES_SORT_COLUMNS)
	sortBy?: (typeof PROMO_USAGES_SORT_COLUMNS)[number] = 'createdAt'
}
