import { Body, Controller, Get, HttpCode, Param, Post, Req, UseGuards } from '@nestjs/common'
import { ApiBearerAuth, ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger'
import { Request } from 'express'

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'
import { ApplyPromocodeDTO } from './dto/apply-promocode.dto'
import { CreateOrderDTO } from './dto/create-order.dto'
import { OrdersService } from './orders.service'

@ApiTags('orders')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('orders')
export class OrdersController {
	constructor(private readonly ordersService: OrdersService) {}

	@Post()
	@HttpCode(201)
	@ApiOperation({ summary: 'Create a new order' })
	@ApiResponse({ status: 201, description: 'Order created successfully' })
	@ApiResponse({ status: 400, description: 'Invalid request body' })
	@ApiResponse({ status: 401, description: 'Unauthorized' })
	create(@Body() dto: CreateOrderDTO, @Req() request: Request & { user: { sub: string } }) {
		return this.ordersService.create(dto, request.user.sub)
	}

	@Get('my')
	@ApiOperation({ summary: 'Get orders of the current user' })
	@ApiResponse({ status: 200, description: 'List of user orders returned successfully' })
	@ApiResponse({ status: 401, description: 'Unauthorized' })
	findMyOrders(@Req() request: Request & { user: { sub: string } }) {
		return this.ordersService.findMyOrders(request.user.sub)
	}

	@Post(':id/apply-promocode')
	@ApiOperation({ summary: 'Apply a promocode to an order' })
	@ApiParam({ name: 'id', description: 'Order MongoDB ObjectId' })
	@ApiResponse({ status: 200, description: 'Promocode applied successfully' })
	@ApiResponse({ status: 400, description: 'Invalid request body or ID format' })
	@ApiResponse({ status: 401, description: 'Unauthorized' })
	@ApiResponse({ status: 403, description: 'Forbidden — order does not belong to current user' })
	@ApiResponse({ status: 404, description: 'Order or promocode not found' })
	@ApiResponse({ status: 409, description: 'Conflict — promocode already applied or lock busy' })
	@ApiResponse({ status: 422, description: 'Unprocessable — usage limit reached or date invalid' })
	applyPromocode(
		@Param('id') id: string,
		@Body() dto: ApplyPromocodeDTO,
		@Req() request: Request & { user: { sub: string } },
	) {
		return this.ordersService.applyPromocode(id, dto, request.user.sub)
	}
}
