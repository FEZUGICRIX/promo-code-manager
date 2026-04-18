import { IsOptional, IsDateString, IsInt, Min, Max, IsEnum, IsString } from 'class-validator'
import { Type } from 'class-transformer'

export enum SortOrder {
	ASC = 'ASC',
	DESC = 'DESC',
}

export class AnalyticsQueryDTO {
	@IsOptional()
	@IsDateString()
	dateFrom?: string

	@IsOptional()
	@IsDateString()
	dateTo?: string

	@IsOptional()
	@Type(() => Number)
	@IsInt()
	@Min(1)
	page?: number = 1

	@IsOptional()
	@Type(() => Number)
	@IsInt()
	@Min(1)
	@Max(100)
	pageSize?: number = 10

	@IsOptional()
	@IsEnum(SortOrder)
	sortOrder?: SortOrder = SortOrder.DESC

	@IsOptional()
	@IsString()
	search?: string
}
