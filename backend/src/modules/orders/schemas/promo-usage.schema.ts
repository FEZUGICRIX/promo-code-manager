import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { HydratedDocument, Types } from 'mongoose'

export type PromoUsageDocument = HydratedDocument<PromoUsage>

@Schema({ timestamps: { createdAt: true, updatedAt: false }, versionKey: false })
export class PromoUsage {
	@Prop({ type: Types.ObjectId, ref: 'Promocode', required: true })
	promocodeId: Types.ObjectId

	@Prop({ type: String, required: true })
	promocodeCode: string

	@Prop({ type: Number, required: true })
	promocodeDiscount: number

	@Prop({ type: String, required: true })
	promocodeDiscountType: string

	@Prop({ type: Types.ObjectId, ref: 'User', required: true })
	userId: Types.ObjectId

	@Prop({ type: String, required: true })
	userName: string

	@Prop({ type: String, required: true })
	userEmail: string

	@Prop({ type: Types.ObjectId, ref: 'Order', required: true })
	orderId: Types.ObjectId

	@Prop({ type: Number, required: true })
	orderAmount: number

	@Prop({ type: Number, required: true })
	discountAmount: number
}

export const PromoUsageSchema = SchemaFactory.createForClass(PromoUsage)
