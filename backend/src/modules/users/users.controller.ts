import { Body, Controller, Delete, Get, Param, Patch, Query, UseGuards } from '@nestjs/common'
import { ApiBearerAuth, ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger'

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'
import { PaginationQueryDTO } from './dto/pagination-query.dto'
import { UpdateUserDTO } from './dto/update-user.dto'
import { UsersService } from './users.service'

@ApiTags('users')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('users')
export class UsersController {
	constructor(private readonly usersService: UsersService) {}

	@Get()
	@ApiOperation({ summary: 'Get paginated list of users' })
	@ApiResponse({ status: 200, description: 'List of users returned successfully' })
	@ApiResponse({ status: 401, description: 'Unauthorized' })
	findAll(@Query() query: PaginationQueryDTO) {
		return this.usersService.findAll(query.page ?? 1, query.limit ?? 10)
	}

	@Get(':id')
	@ApiOperation({ summary: 'Get user by ID' })
	@ApiParam({ name: 'id', description: 'User MongoDB ObjectId' })
	@ApiResponse({ status: 200, description: 'User returned successfully' })
	@ApiResponse({ status: 400, description: 'Invalid ID format' })
	@ApiResponse({ status: 401, description: 'Unauthorized' })
	@ApiResponse({ status: 404, description: 'User not found' })
	findById(@Param('id') id: string) {
		return this.usersService.findById(id)
	}

	@Patch(':id')
	@ApiOperation({ summary: 'Update user by ID' })
	@ApiParam({ name: 'id', description: 'User MongoDB ObjectId' })
	@ApiResponse({ status: 200, description: 'User updated successfully' })
	@ApiResponse({ status: 400, description: 'Invalid request body or ID format' })
	@ApiResponse({ status: 401, description: 'Unauthorized' })
	@ApiResponse({ status: 404, description: 'User not found' })
	update(@Param('id') id: string, @Body() dto: UpdateUserDTO) {
		return this.usersService.update(id, dto)
	}

	@Delete(':id')
	@ApiOperation({ summary: 'Deactivate user by ID (soft delete)' })
	@ApiParam({ name: 'id', description: 'User MongoDB ObjectId' })
	@ApiResponse({ status: 200, description: 'User deactivated successfully' })
	@ApiResponse({ status: 401, description: 'Unauthorized' })
	@ApiResponse({ status: 404, description: 'User not found' })
	deactivate(@Param('id') id: string) {
		return this.usersService.deactivate(id)
	}
}
