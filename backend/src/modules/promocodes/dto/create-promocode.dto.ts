import { ApiProperty } from '@nestjs/swagger'
import {
	IsDateString,
	IsEnum,
	IsInt,
	IsNotEmpty,
	IsNumber,
	IsOptional,
	IsString,
	Min,
} from 'class-validator'
import { DiscountType } from '../schemas/promocode.schema'

export class CreatePromocodeDTO {
	@IsString()
	@IsNotEmpty()
	@ApiProperty({ example: 'SUMMER20' })
	code: string

	@IsOptional()
	@IsEnum(DiscountType)
	@ApiProperty({ enum: DiscountType, default: DiscountType.PERCENTAGE, required: false })
	discountType?: DiscountType

	@IsNumber()
	@Min(1)
	@ApiProperty({ example: 20 })
	discount: number

	@IsInt()
	@Min(1)
	@ApiProperty({ example: 100 })
	totalLimit: number

	@IsInt()
	@Min(1)
	@ApiProperty({ example: 1 })
	userLimit: number

	@IsOptional()
	@IsDateString()
	@ApiProperty({ example: '2024-06-01T00:00:00.000Z', required: false })
	dateFrom?: string

	@IsOptional()
	@IsDateString()
	@ApiProperty({ example: '2024-08-31T23:59:59.000Z', required: false })
	dateTo?: string
}
