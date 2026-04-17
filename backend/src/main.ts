import { NestFactory } from '@nestjs/core'
import { ValidationPipe } from '@nestjs/common'
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger'
import { CoreModule } from '@/core/core.module'

async function bootstrap() {
	const app = await NestFactory.create(CoreModule)

	// CORS
	app.enableCors({
		origin: process.env.FRONTEND_URL || 'http://localhost:5173',
		credentials: true,
	})

	// Global validation pipe
	app.useGlobalPipes(
		new ValidationPipe({
			whitelist: true,
			forbidNonWhitelisted: true,
			transform: true,
		}),
	)

	// Swagger
	const config = new DocumentBuilder()
		.setTitle('PromoCode Manager API')
		.setDescription('API для управления промокодами с аналитикой')
		.setVersion('1.0')
		.addBearerAuth()
		.build()
	const document = SwaggerModule.createDocument(app, config)
	SwaggerModule.setup('api', app, document)

	const port = process.env.PORT || 3000
	await app.listen(port)
	console.log(`🚀 Application is running on: http://localhost:${port}`)
	console.log(`📚 Swagger documentation: http://localhost:${port}/api`)
}
bootstrap()
