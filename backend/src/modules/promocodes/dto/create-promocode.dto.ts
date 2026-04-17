import { ApiProperty } from '@nestjs/swagger'
import {
	IsDateString,
	IsInt,
	IsNotEmpty,
	IsNumber,
	IsOptional,
	IsString,
	Max,
	Min,
} from 'class-validator'

export class CreatePromocodeDTO {
	@IsString()
	@IsNotEmpty()
	@ApiProperty({ example: 'SUMMER20' })
	code: string

	@IsNumber()
	@Min(1)
	@Max(100)
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
