import { Module } from '@nestjs/common'
import { appConfig, mongooseConfig, throttlerConfig } from './config'
import { ClickhouseModule } from './clickhouse/clickhouse.module'
import { RedisModule } from './redis/redis.module'
import { AuthModule } from '../modules/auth/auth.module'

@Module({
	imports: [
		appConfig,
		mongooseConfig,
		throttlerConfig,
		ClickhouseModule,
		RedisModule,
		
		AuthModule
	],
})
export class CoreModule {}
