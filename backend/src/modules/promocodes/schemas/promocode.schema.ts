import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { HydratedDocument } from 'mongoose'

export type PromocodeDocument = HydratedDocument<Promocode>

@Schema({ timestamps: true, versionKey: false })
export class Promocode {
	@Prop({ type: String, required: true, unique: true, trim: true })
	code: string

	@Prop({ type: Number, required: true, min: 1, max: 100 })
	discount: number

	@Prop({ type: Number, required: true, min: 1 })
	totalLimit: number

	@Prop({ type: Number, required: true, min: 1 })
	userLimit: number

	@Prop({ type: Date, required: false })
	dateFrom?: Date

	@Prop({ type: Date, required: false })
	dateTo?: Date

	@Prop({ type: Boolean, default: true })
	isActive: boolean
}

export const PromocodeSchema = SchemaFactory.createForClass(Promocode)
