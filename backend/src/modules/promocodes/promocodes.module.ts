import { Module } from '@nestjs/common'
import { MongooseModule } from '@nestjs/mongoose'

import { Promocode, PromocodeSchema } from './schemas/promocode.schema'
import { PromocodesController } from './promocodes.controller'
import { PromocodesService } from './promocodes.service'

@Module({
	imports: [MongooseModule.forFeature([{ name: Promocode.name, schema: PromocodeSchema }])],
	controllers: [PromocodesController],
	providers: [PromocodesService],
	exports: [MongooseModule, PromocodesService],
})
export class PromocodesModule {}
