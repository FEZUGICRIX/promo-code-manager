import { IsOptional, IsIn, IsBoolean } from 'class-validator'
import { Transform } from 'class-transformer'
import { AnalyticsQueryDTO } from './analytics-query.dto'

export const PROMOCODES_SORT_COLUMNS = [
	'id',
	'code',
	'discount',
	'totalLimit',
	'userLimit',
	'isActive',
	'createdAt',
	'usageCount',
	'totalRevenue',
	'uniqueUsers',
	'totalDiscount',
] as const

export class PromocodesQueryDTO extends AnalyticsQueryDTO {
	@IsOptional()
	@IsIn(PROMOCODES_SORT_COLUMNS)
	sortBy?: (typeof PROMOCODES_SORT_COLUMNS)[number] = 'createdAt'

	@IsOptional()
	@Transform(({ value }) => value === 'true' || value === true)
	@IsBoolean()
	isActive?: boolean
}
