import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { HydratedDocument } from 'mongoose'

export type UserDocument = HydratedDocument<User>

@Schema({ timestamps: true, versionKey: false })
export class User {
	@Prop({ type: String, required: true, unique: true, lowercase: true, trim: true })
	email: string

	@Prop({ type: String, required: true, select: false })
	passwordHash: string

	@Prop({ type: String, required: true, minlength: 2, trim: true })
	name: string

	@Prop({ type: String, required: true, minlength: 10, trim: true })
	phone: string

	@Prop({ type: Boolean, default: true })
	isActive: boolean
}

export const UserSchema = SchemaFactory.createForClass(User)
