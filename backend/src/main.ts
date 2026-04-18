import { NestFactory } from '@nestjs/core'
import { ValidationPipe } from '@nestjs/common'
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger'
import cookieParser from 'cookie-parser'
import { CoreModule } from '@/core/core.module'
import { createCorsOptions } from './core/config'
import { ConfigService } from '@nestjs/config'

async function bootstrap() {
	const app = await NestFactory.create(CoreModule)
	const config = app.get(ConfigService)

	// Cookie parser middleware
	app.use(cookieParser())

	// CORS with credentials support
	app.enableCors(createCorsOptions(config))

	// Global validation pipe
	app.useGlobalPipes(
		new ValidationPipe({
			whitelist: true,
			forbidNonWhitelisted: true,
			transform: true,
		}),
	)

	// Swagger
	const configSwagger = new DocumentBuilder()
		.setTitle('PromoCode Manager API')
		.setDescription('API для управления промокодами с аналитикой')
		.setVersion('1.0')
		.addBearerAuth()
		.build()
	const document = SwaggerModule.createDocument(app, configSwagger)
	SwaggerModule.setup('api', app, document)

	const port = process.env.PORT || 3000
	await app.listen(port)
	console.log(`🚀 Application is running on: http://localhost:${port}`)
	console.log(`📚 Swagger documentation: http://localhost:${port}/api`)
}
bootstrap()
