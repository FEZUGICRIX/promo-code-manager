import { ConfigModule, ConfigModuleOptions } from '@nestjs/config'
import * as Joi from 'joi'

export const configOptions: ConfigModuleOptions = {
	isGlobal: true,
	validationSchema: Joi.object({
		// App
		NODE_ENV: Joi.string().valid('development', 'production', 'test').default('development'),
		PORT: Joi.number().default(3000),

		// MongoDB
		MONGODB_URI: Joi.string().default(
			'mongodb://admin:admin123@localhost:27017/promocode_db?authSource=admin',
		),

		// ClickHouse
		CLICKHOUSE_HOST: Joi.string().default('localhost'),
		CLICKHOUSE_PORT: Joi.number().default(8123),
		CLICKHOUSE_DATABASE: Joi.string().default('promocode_analytics'),
		CLICKHOUSE_USER: Joi.string().default('default'),
		CLICKHOUSE_PASSWORD: Joi.string().default('clickhouse123'),

		// Redis
		REDIS_HOST: Joi.string().default('localhost'),
		REDIS_PORT: Joi.number().default(6379),
		REDIS_PASSWORD: Joi.string().default('redis123'),

		// JWT
		JWT_SECRET: Joi.string().default('your-super-secret-jwt-key-change-in-production'),
		JWT_EXPIRES_IN: Joi.string().default('15m'),
		JWT_REFRESH_SECRET: Joi.string().default('your-super-secret-refresh-key-change-in-production'),
		JWT_REFRESH_EXPIRES_IN: Joi.string().default('7d'),

		// Frontend
		FRONTEND_URL: Joi.string().default('http://localhost:5173'),
	}),
}

export const appConfig = ConfigModule.forRoot(configOptions)
