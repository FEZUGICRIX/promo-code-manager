import { Module } from '@nestjs/common'
import { MongooseModule } from '@nestjs/mongoose'
import { ThrottlerModule } from '@nestjs/throttler'
import { ConfigModule } from '@nestjs/config'
// import { AuthModule } from './auth/auth.module'
// import { UsersModule } from './users/users.module'
// import { PromocodesModule } from './promocodes/promocodes.module'
// import { OrdersModule } from './orders/orders.module'
// import { AnalyticsModule } from './analytics/analytics.module'
// import { ClickhouseModule } from './clickhouse/clickhouse.module'
// import { RedisModule } from './redis/redis.module'

@Module({
	imports: [
		ConfigModule.forRoot({
			isGlobal: true,
		}),
		MongooseModule.forRoot(process.env.MONGODB_URI || 'mongodb://localhost:27017/promocode_db'),
		ThrottlerModule.forRoot([
			{
				ttl: 60000,
				limit: 10,
			},
		]),
		// ClickhouseModule,
		// RedisModule,
		// AuthModule,
		// UsersModule,
		// PromocodesModule,
		// OrdersModule,
		// AnalyticsModule,
	],
})
export class AppModule {}
