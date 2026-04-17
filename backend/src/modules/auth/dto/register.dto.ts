import { ApiProperty } from '@nestjs/swagger'
import { IsEmail, IsString, MinLength } from 'class-validator'

export class RegisterDTO {
	@IsEmail()
	@ApiProperty({ example: 'user@example.com' })
	email: string

	@IsString()
	@MinLength(8)
	@ApiProperty({ example: 'password123' })
	password: string

	@IsString()
	@MinLength(2)
	@ApiProperty({ example: 'John Doe' })
	name: string

	@IsString()
	@MinLength(10)
	@ApiProperty({ example: '+79001234567' })
	phone: string
}
