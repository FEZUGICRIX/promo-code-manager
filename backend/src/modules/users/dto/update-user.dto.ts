import { ApiProperty } from '@nestjs/swagger'
import { IsBoolean, IsOptional, IsString, MinLength } from 'class-validator'

export class UpdateUserDTO {
	@IsOptional()
	@IsString()
	@MinLength(2)
	@ApiProperty({ example: 'John Doe', required: false })
	name?: string

	@IsOptional()
	@IsString()
	@MinLength(10)
	@ApiProperty({ example: '+79001234567', required: false })
	phone?: string

	@IsOptional()
	@IsBoolean()
	@ApiProperty({ example: true, required: false })
	isActive?: boolean
}
