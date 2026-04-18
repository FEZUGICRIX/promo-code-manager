import { IsOptional, IsIn, IsBoolean } from 'class-validator'
import { Transform } from 'class-transformer'
import { AnalyticsQueryDTO } from './analytics-query.dto'

export const USERS_SORT_COLUMNS = [
	'id',
	'name',
	'email',
	'phone',
	'isActive',
	'createdAt',
	'totalOrders',
	'totalSpent',
	'totalDiscount',
	'promoUsagesCount',
] as const

export class UsersQueryDTO extends AnalyticsQueryDTO {
	@IsOptional()
	@IsIn(USERS_SORT_COLUMNS)
	sortBy?: (typeof USERS_SORT_COLUMNS)[number] = 'createdAt'

	@IsOptional()
	@Transform(({ value }) => value === 'true' || value === true)
	@IsBoolean()
	isActive?: boolean
}
