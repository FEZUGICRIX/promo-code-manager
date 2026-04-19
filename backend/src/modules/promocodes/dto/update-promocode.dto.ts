import { ApiProperty } from '@nestjs/swagger'
import { IsBoolean, IsDateString, IsEnum, IsInt, IsNumber, IsOptional, Min } from 'class-validator'
import { DiscountType } from '../schemas/promocode.schema'

export class UpdatePromocodeDTO {
	@IsOptional()
	@IsEnum(DiscountType)
	@ApiProperty({ enum: DiscountType, required: false })
	discountType?: DiscountType

	@IsOptional()
	@IsNumber()
	@Min(1)
	@ApiProperty({ example: 20, required: false })
	discount?: number

	@IsOptional()
	@IsInt()
	@Min(1)
	@ApiProperty({ example: 100, required: false })
	totalLimit?: number

	@IsOptional()
	@IsInt()
	@Min(1)
	@ApiProperty({ example: 1, required: false })
	userLimit?: number

	@IsOptional()
	@IsDateString()
	@ApiProperty({ example: '2024-06-01T00:00:00.000Z', required: false })
	dateFrom?: string

	@IsOptional()
	@IsDateString()
	@ApiProperty({ example: '2024-08-31T23:59:59.000Z', required: false })
	dateTo?: string

	@IsOptional()
	@IsBoolean()
	@ApiProperty({ example: true, required: false })
	isActive?: boolean
}
