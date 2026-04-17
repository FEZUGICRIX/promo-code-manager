import { Module } from '@nestjs/common'
import { MongooseModule } from '@nestjs/mongoose'

import { Promocode, PromocodeSchema } from '../promocodes/schemas/promocode.schema'
import { UsersModule } from '../users/users.module'
import { OrdersController } from './orders.controller'
import { OrdersService } from './orders.service'
import { Order, OrderSchema } from './schemas/order.schema'
import { PromoUsage, PromoUsageSchema } from './schemas/promo-usage.schema'

@Module({
	imports: [
		MongooseModule.forFeature([
			{ name: Order.name, schema: OrderSchema },
			{ name: PromoUsage.name, schema: PromoUsageSchema },
			{ name: Promocode.name, schema: PromocodeSchema },
		]),
		UsersModule,
	],
	controllers: [OrdersController],
	providers: [OrdersService],
	exports: [MongooseModule, OrdersService],
})
export class OrdersModule {}
