import { ApiProperty } from '@nestjs/swagger'
import { IsNotEmpty, IsString } from 'class-validator'

export class ApplyPromocodeDTO {
	@IsString()
	@IsNotEmpty()
	@ApiProperty({ example: 'SUMMER20' })
	promocodeCode: string
}
