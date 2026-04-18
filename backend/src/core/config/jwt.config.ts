import { JwtModuleAsyncOptions } from '@nestjs/jwt'
import { ConfigService } from '@nestjs/config'

export const getJwtConfig = (): JwtModuleAsyncOptions => ({
	inject: [ConfigService],
	useFactory: (config: ConfigService) => ({
		secret: config.get<string>('JWT_SECRET'),
		signOptions: {
			expiresIn: config.get<string>('JWT_EXPIRES_IN', '15m'),
		},
	}),
})
