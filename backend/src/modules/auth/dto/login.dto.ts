import { ApiProperty } from '@nestjs/swagger'
import { IsEmail, IsNotEmpty, IsString } from 'class-validator'

export class LoginDTO {
	@IsEmail()
	@ApiProperty({ example: 'user@example.com' })
	email: string

	@IsString()
	@IsNotEmpty()
	@ApiProperty({ example: 'password123' })
	password: string
}
