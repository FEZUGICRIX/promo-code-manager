import { Module } from '@nestjs/common'
import { JwtModule } from '@nestjs/jwt'
import { MongooseModule } from '@nestjs/mongoose'
import { PassportModule } from '@nestjs/passport'

import { AuthController } from './auth.controller'
import { AuthService } from './auth.service'
import { JwtAuthGuard } from './guards/jwt-auth.guard'
import { User, UserSchema } from './schemas/user.schema'
import { JwtStrategy } from './strategies/jwt.strategy'
import { getJwtConfig } from '@/core/config'

@Module({
	imports: [
		MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
		PassportModule.register({ defaultStrategy: 'jwt' }),
		JwtModule.registerAsync(getJwtConfig()),
	],
	controllers: [AuthController],
	providers: [AuthService, JwtStrategy, JwtAuthGuard],
	exports: [AuthService, JwtAuthGuard],
})
export class AuthModule {}
