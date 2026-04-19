import { Controller, Get, Query, UseGuards } from '@nestjs/common'

import { JwtAuthGuard } from '@/modules/auth/guards/jwt-auth.guard'
import { AnalyticsService } from './analytics.service'
import type {
	AnalyticsOrder,
	AnalyticsPromoUsage,
	AnalyticsPromocode,
	AnalyticsUser,
	PaginatedResponse,
	UsersSummaryResponse,
} from './interfaces'
import { OrdersQueryDTO, PromoUsagesQueryDTO, PromocodesQueryDTO, UsersQueryDTO } from './dto'

@Controller('analytics')
@UseGuards(JwtAuthGuard)
export class AnalyticsController {
	constructor(private readonly analyticsService: AnalyticsService) {}

	@Get('users')
	getUsers(@Query() dto: UsersQueryDTO): Promise<PaginatedResponse<AnalyticsUser>> {
		return this.analyticsService.getUsers(dto)
	}

	@Get('promocodes')
	getPromocodes(@Query() dto: PromocodesQueryDTO): Promise<PaginatedResponse<AnalyticsPromocode>> {
		return this.analyticsService.getPromocodes(dto)
	}

	@Get('promo-usages')
	getPromoUsages(
		@Query() dto: PromoUsagesQueryDTO,
	): Promise<PaginatedResponse<AnalyticsPromoUsage>> {
		return this.analyticsService.getPromoUsages(dto)
	}

	@Get('orders')
	getOrders(@Query() dto: OrdersQueryDTO): Promise<PaginatedResponse<AnalyticsOrder>> {
		return this.analyticsService.getOrders(dto)
	}

	@Get('users/summary')
	getUsersSummary(
		@Query('dateFrom') dateFrom?: string,
		@Query('dateTo') dateTo?: string,
	): Promise<UsersSummaryResponse> {
		return this.analyticsService.getUsersSummary(dateFrom, dateTo)
	}
}
