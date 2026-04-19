import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { HydratedDocument, Types } from 'mongoose'

export type OrderDocument = HydratedDocument<Order>

@Schema({ timestamps: true, versionKey: false })
export class Order {
	@Prop({ type: Types.ObjectId, ref: 'User', required: true })
	userId: Types.ObjectId

	@Prop({ type: Number, required: true, min: 0 })
	amount: number

	@Prop({ type: Number, default: 0 })
	discount: number

	@Prop({ type: Number, required: true })
	finalAmount: number

	@Prop({ type: Types.ObjectId, ref: 'Promocode', required: false })
	promocodeId?: Types.ObjectId

	@Prop({ type: String, required: false })
	promocodeCode?: string
}

export const OrderSchema = SchemaFactory.createForClass(Order)
