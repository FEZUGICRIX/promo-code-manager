import { MongooseModule } from '@nestjs/mongoose'
import { ConfigModule, ConfigService } from '@nestjs/config'

export const mongooseConfig = MongooseModule.forRootAsync({
	imports: [ConfigModule],
	useFactory: (configService: ConfigService) => ({
		uri: configService.get<string>('MONGODB_URI', 'mongodb://localhost:27017/promocode_db'),
	}),
	inject: [ConfigService],
})
