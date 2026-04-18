import { Controller, Get, Query, UseGuards } from '@nestjs/common'

import { JwtAuthGuard } from '@/modules/auth/guards/jwt-auth.guard'
import { AnalyticsService } from './analytics.service'
import { PromoUsagesQueryDTO } from './dto/promo-usages-query.dto'
import { PromocodesQueryDTO } from './dto/promocodes-query.dto'
import { UsersQueryDTO } from './dto/users-query.dto'
import { AnalyticsPromoUsage } from './interfaces/analytics-promo-usage.interface'
import { AnalyticsPromocode } from './interfaces/analytics-promocode.interface'
import { AnalyticsUser } from './interfaces/analytics-user.interface'
import { PaginatedResponse } from './interfaces/paginated-response.interface'

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
}
