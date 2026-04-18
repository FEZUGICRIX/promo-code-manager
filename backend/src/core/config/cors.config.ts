import { ConfigService } from '@nestjs/config'

export function createCorsOptions(config: ConfigService) {
	return {
		origin: config.getOrThrow<string>('FRONTEND_URL') ?? 'http://localhost:5173',
		credentials: true,
	}
}
