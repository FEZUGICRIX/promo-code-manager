import {
	Body,
	Controller,
	Delete,
	Get,
	HttpCode,
	Param,
	Patch,
	Post,
	Query,
	UseGuards,
} from '@nestjs/common'
import { ApiBearerAuth, ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger'

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'
import { PaginationQueryDTO } from '../users/dto/pagination-query.dto'
import { CreatePromocodeDTO } from './dto/create-promocode.dto'
import { UpdatePromocodeDTO } from './dto/update-promocode.dto'
import { PromocodesService } from './promocodes.service'

@ApiTags('promocodes')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('promocodes')
export class PromocodesController {
	constructor(private readonly promocodesService: PromocodesService) {}

	@Post()
	@HttpCode(201)
	@ApiOperation({ summary: 'Create a new promocode' })
	@ApiResponse({ status: 201, description: 'Promocode created successfully' })
	@ApiResponse({ status: 400, description: 'Invalid request body' })
	@ApiResponse({ status: 401, description: 'Unauthorized' })
	@ApiResponse({ status: 409, description: 'Promocode code already exists' })
	create(@Body() dto: CreatePromocodeDTO) {
		return this.promocodesService.create(dto)
	}

	@Get()
	@ApiOperation({ summary: 'Get paginated list of promocodes' })
	@ApiResponse({ status: 200, description: 'List of promocodes returned successfully' })
	@ApiResponse({ status: 401, description: 'Unauthorized' })
	findAll(@Query() query: PaginationQueryDTO) {
		return this.promocodesService.findAll(query.page ?? 1, query.limit ?? 10)
	}

	@Get(':id')
	@ApiOperation({ summary: 'Get promocode by ID' })
	@ApiParam({ name: 'id', description: 'Promocode MongoDB ObjectId' })
	@ApiResponse({ status: 200, description: 'Promocode returned successfully' })
	@ApiResponse({ status: 400, description: 'Invalid ID format' })
	@ApiResponse({ status: 401, description: 'Unauthorized' })
	@ApiResponse({ status: 404, description: 'Promocode not found' })
	findById(@Param('id') id: string) {
		return this.promocodesService.findById(id)
	}

	@Patch(':id')
	@ApiOperation({ summary: 'Update promocode by ID' })
	@ApiParam({ name: 'id', description: 'Promocode MongoDB ObjectId' })
	@ApiResponse({ status: 200, description: 'Promocode updated successfully' })
	@ApiResponse({ status: 400, description: 'Invalid request body or ID format' })
	@ApiResponse({ status: 401, description: 'Unauthorized' })
	@ApiResponse({ status: 404, description: 'Promocode not found' })
	update(@Param('id') id: string, @Body() dto: UpdatePromocodeDTO) {
		return this.promocodesService.update(id, dto)
	}

	@Delete(':id')
	@ApiOperation({ summary: 'Deactivate promocode by ID (soft delete)' })
	@ApiParam({ name: 'id', description: 'Promocode MongoDB ObjectId' })
	@ApiResponse({ status: 200, description: 'Promocode deactivated successfully' })
	@ApiResponse({ status: 401, description: 'Unauthorized' })
	@ApiResponse({ status: 404, description: 'Promocode not found' })
	deactivate(@Param('id') id: string) {
		return this.promocodesService.deactivate(id)
	}
}
