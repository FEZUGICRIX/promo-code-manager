import { Module } from '@nestjs/common'
import { appConfig, mongooseConfig, throttlerConfig } from './config'
import { ClickhouseModule } from './clickhouse/clickhouse.module'
import { RedisModule } from './redis/redis.module'
import { AuthModule } from '../modules/auth/auth.module'
import { UsersModule } from '../modules/users/users.module'
import { PromocodesModule } from '../modules/promocodes/promocodes.module'
import { OrdersModule } from '../modules/orders/orders.module'
import { AnalyticsModule } from '../modules/analytics/analytics.module'

@Module({
	imports: [
		appConfig,
		mongooseConfig,
		throttlerConfig,
		ClickhouseModule,
		RedisModule,
		AuthModule,
		UsersModule,
		PromocodesModule,
		OrdersModule,
		AnalyticsModule,
	],
})
export class CoreModule {}
