import { Injectable, Logger, NotFoundException } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { Model } from 'mongoose'

import { ClickhouseService } from '@/core/clickhouse/clickhouse.service'
import { User, UserDocument } from '../auth/schemas/user.schema'
import { UpdateUserDTO } from './dto/update-user.dto'

@Injectable()
export class UsersService {
	private readonly logger = new Logger(UsersService.name)

	constructor(
		@InjectModel(User.name) private readonly userModel: Model<UserDocument>,
		private readonly clickhouseService: ClickhouseService,
	) {}

	async findAll(page: number, limit: number): Promise<{ data: UserDocument[]; total: number }> {
		const [data, total] = await Promise.all([
			this.userModel
				.find()
				.select('-passwordHash')
				.sort({ createdAt: -1 })
				.skip((page - 1) * limit)
				.limit(limit),
			this.userModel.countDocuments(),
		])
		return { data, total }
	}

	async findById(id: string): Promise<UserDocument> {
		const user = await this.userModel.findById(id).select('-passwordHash')
		if (!user) {
			throw new NotFoundException('User not found')
		}
		return user
	}

	async update(id: string, dto: UpdateUserDTO): Promise<UserDocument> {
		const user = await this.userModel
			.findByIdAndUpdate(id, dto, { new: true })
			.select('-passwordHash')
		if (!user) {
			throw new NotFoundException('User not found')
		}
		void this.syncToClickHouse(user)
		return user
	}

	async deactivate(id: string): Promise<UserDocument> {
		const user = await this.userModel
			.findByIdAndUpdate(id, { isActive: false }, { new: true })
			.select('-passwordHash')
		if (!user) {
			throw new NotFoundException('User not found')
		}
		void this.syncToClickHouse(user)
		return user
	}

	private formatDate(date: Date | string | null | undefined): string | null {
		if (!date) return null
		return new Date(date).toISOString().replace('T', ' ').substring(0, 19)
	}

	async syncToClickHouse(user: UserDocument): Promise<void> {
		try {
			const doc = user.toObject() as { createdAt?: Date; updatedAt?: Date }
			await this.clickhouseService.insert('users', [
				{
					id: user._id.toString(),
					email: user.email,
					name: user.name,
					phone: user.phone,
					isActive: user.isActive ? 1 : 0,
					createdAt: this.formatDate(doc.createdAt),
					updatedAt: this.formatDate(doc.updatedAt),
				},
			])
		} catch (err: unknown) {
			this.logger.error(
				`Failed to sync user ${user._id.toString()} to ClickHouse: ${err instanceof Error ? err.message : String(err)}`,
			)
		}
	}
}
