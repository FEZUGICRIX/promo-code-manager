import { ApiProperty } from '@nestjs/swagger'
import { IsBoolean, IsDateString, IsInt, IsNumber, IsOptional, Max, Min } from 'class-validator'

export class UpdatePromocodeDTO {
	@IsOptional()
	@IsNumber()
	@Min(1)
	@Max(100)
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
