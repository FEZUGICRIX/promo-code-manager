import { ApiProperty } from '@nestjs/swagger'
import { IsNumber, Min } from 'class-validator'

export class CreateOrderDTO {
	@IsNumber()
	@Min(0.01)
	@ApiProperty({ example: 1500.0 })
	amount: number
}
