import { ConflictException, Injectable, Logger, UnauthorizedException } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { JwtService } from '@nestjs/jwt'
import { Model } from 'mongoose'
import * as bcrypt from 'bcrypt'

import { ClickhouseService } from '@/core/clickhouse/clickhouse.service'
import { RegisterDTO } from './dto/register.dto'
import { LoginDTO } from './dto/login.dto'
import { User, UserDocument } from './schemas/user.schema'
import { JwtPayload } from './strategies/jwt.strategy'

// TODO: ВЫНЕСТИ
export interface UserResponse {
	id: string
	email: string
	name: string
	phone: string
	isActive: boolean
	createdAt: Date
	updatedAt: Date
}

// TODO: ВЫНЕСТИ
export interface AuthTokens {
	accessToken: string
	refreshToken: string
}

@Injectable()
export class AuthService {
	private readonly logger = new Logger(AuthService.name)

	constructor(
		@InjectModel(User.name) private readonly userModel: Model<UserDocument>,
		private readonly jwtService: JwtService,
		private readonly clickhouseService: ClickhouseService,
	) {}

	async register(dto: RegisterDTO): Promise<{ user: UserResponse } & AuthTokens> {
		const passwordHash = await bcrypt.hash(dto.password, 10)

		let doc: UserDocument
		try {
			doc = await this.userModel.create({
				email: dto.email,
				passwordHash,
				name: dto.name,
				phone: dto.phone,
			})
		} catch (err: unknown) {
			if (this.isDuplicateKeyError(err)) {
				throw new ConflictException('Email already registered')
			}
			throw err
		}

		// Fire-and-forget ClickHouse sync — never blocks the HTTP response
		this.syncUserToClickhouse(doc)

		const tokens = this.generateTokens({ sub: doc.id as string, email: doc.email })
		return { user: this.toUserResponse(doc), ...tokens }
	}

	async login(dto: LoginDTO): Promise<AuthTokens> {
		const doc = await this.userModel
			.findOne({ email: dto.email.toLowerCase() })
			.select('+passwordHash')
			.exec()

		if (!doc) {
			throw new UnauthorizedException('Invalid credentials')
		}

		const passwordMatch = await bcrypt.compare(dto.password, doc.passwordHash)
		if (!passwordMatch) {
			throw new UnauthorizedException('Invalid credentials')
		}

		if (!doc.isActive) {
			throw new UnauthorizedException('Account is disabled')
		}

		return this.generateTokens({ sub: doc.id as string, email: doc.email })
	}

	async refreshToken(token: string): Promise<{ accessToken: string }> {
		let payload: JwtPayload
		try {
			payload = this.jwtService.verify<JwtPayload>(token)
		} catch {
			throw new UnauthorizedException('Invalid or expired refresh token')
		}

		const accessToken = this.jwtService.sign(
			{ sub: payload.sub, email: payload.email },
			{ expiresIn: '15m' },
		)
		return { accessToken }
	}

	generateTokens(payload: JwtPayload): AuthTokens {
		return {
			accessToken: this.jwtService.sign(payload, { expiresIn: '15m' }),
			refreshToken: this.jwtService.sign(payload, { expiresIn: '7d' }),
		}
	}

	// ── Private helpers ──────────────────────────────────────────────────────

	private toUserResponse(doc: UserDocument): UserResponse {
		return {
			id: doc.id as string,
			email: doc.email,
			name: doc.name,
			phone: doc.phone,
			isActive: doc.isActive,
			createdAt: (doc as unknown as { createdAt: Date }).createdAt,
			updatedAt: (doc as unknown as { updatedAt: Date }).updatedAt,
		}
	}

	private isDuplicateKeyError(err: unknown): boolean {
		return (
			typeof err === 'object' &&
			err !== null &&
			'code' in err &&
			(err as { code: unknown }).code === 11000
		)
	}

	private syncUserToClickhouse(doc: UserDocument): void {
		const raw = doc.toObject() as unknown as {
			_id: { toString(): string }
			email: string
			name: string
			phone: string
			isActive: boolean
			createdAt: Date
			updatedAt: Date
		}
		const record = {
			id: String(raw._id),
			email: raw.email,
			name: raw.name,
			phone: raw.phone,
			isActive: raw.isActive ? 1 : 0,
			createdAt: raw.createdAt.toISOString().replace('T', ' ').substring(0, 19),
			updatedAt: raw.updatedAt.toISOString().replace('T', ' ').substring(0, 19),
		}

		this.clickhouseService.insert('users', [record]).catch((err: unknown) => {
			this.logger.error(
				`ClickHouse user sync failed: ${err instanceof Error ? err.message : String(err)}`,
			)
		})
	}
}
