import { ConflictException, Injectable, Logger, NotFoundException } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { Model } from 'mongoose'

import { ClickhouseService } from '@/core/clickhouse/clickhouse.service'
import { CreatePromocodeDTO } from './dto/create-promocode.dto'
import { UpdatePromocodeDTO } from './dto/update-promocode.dto'
import { Promocode, PromocodeDocument } from './schemas/promocode.schema'

@Injectable()
export class PromocodesService {
	private readonly logger = new Logger(PromocodesService.name)

	constructor(
		@InjectModel(Promocode.name) private readonly promocodeModel: Model<PromocodeDocument>,
		private readonly clickhouseService: ClickhouseService,
	) {}

	async create(dto: CreatePromocodeDTO): Promise<PromocodeDocument> {
		try {
			const promo = await this.promocodeModel.create(dto)
			await this.syncToClickHouse(promo)
			return promo
		} catch (err: unknown) {
			const mongoErr = err as { code?: number }
			if (mongoErr.code === 11000) {
				throw new ConflictException('Promocode code already exists')
			}
			throw err
		}
	}

	async findAll(
		page: number,
		limit: number,
	): Promise<{ data: PromocodeDocument[]; total: number }> {
		const [data, total] = await Promise.all([
			this.promocodeModel
				.find()
				.sort({ createdAt: -1 })
				.skip((page - 1) * limit)
				.limit(limit),
			this.promocodeModel.countDocuments(),
		])
		return { data, total }
	}

	async findById(id: string): Promise<PromocodeDocument> {
		const promo = await this.promocodeModel.findById(id)
		if (!promo) {
			throw new NotFoundException('Promocode not found')
		}
		return promo
	}

	async update(id: string, dto: UpdatePromocodeDTO): Promise<PromocodeDocument> {
		const promo = await this.promocodeModel.findById(id)
		if (!promo) {
			throw new NotFoundException('Promocode not found')
		}
		promo.set(dto)
		await promo.save()
		await this.syncToClickHouse(promo)
		return promo
	}

	async deactivate(id: string): Promise<PromocodeDocument> {
		const promo = await this.promocodeModel.findById(id)
		if (!promo) {
			throw new NotFoundException('Promocode not found')
		}
		promo.set({ isActive: false })
		await promo.save()
		await this.syncToClickHouse(promo)
		return promo
	}

	private formatDate(date: Date | string | null | undefined): string | null {
		if (!date) return null
		return new Date(date).toISOString().replace('T', ' ').substring(0, 19)
	}

	async syncToClickHouse(promo: PromocodeDocument): Promise<void> {
		try {
			const doc = promo.toObject() as {
				createdAt?: Date
				updatedAt?: Date
			}
			const record: Record<string, unknown> = {
				id: promo._id.toString(),
				code: promo.code,
				discountType: promo.discountType,
				discount: promo.discount,
				totalLimit: promo.totalLimit,
				userLimit: promo.userLimit,
				dateFrom: this.formatDate(promo.dateFrom),
				dateTo: this.formatDate(promo.dateTo),
				isActive: promo.isActive ? 1 : 0,
				createdAt: this.formatDate(doc.createdAt),
				updatedAt: this.formatDate(doc.updatedAt),
			}
			await this.clickhouseService.insert('promocodes', [record])
		} catch (err: unknown) {
			this.logger.error(
				`Failed to sync promocode ${promo._id.toString()} to ClickHouse: ${err instanceof Error ? err.message : String(err)}`,
			)
		}
	}
}
