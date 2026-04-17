import { ApiProperty } from '@nestjs/swagger'
import { Type } from 'class-transformer'
import { IsInt, IsOptional, Max, Min } from 'class-validator'

export class PaginationQueryDTO {
	@IsOptional()
	@IsInt()
	@Min(1)
	@Type(() => Number)
	@ApiProperty({ example: 1, required: false })
	page?: number = 1

	@IsOptional()
	@IsInt()
	@Min(1)
	@Max(100)
	@Type(() => Number)
	@ApiProperty({ example: 10, required: false })
	limit?: number = 10
}
