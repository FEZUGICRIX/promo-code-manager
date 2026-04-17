import {
	ConflictException,
	ForbiddenException,
	Injectable,
	Logger,
	NotFoundException,
	UnprocessableEntityException,
} from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { Model, Types } from 'mongoose'

import { ClickhouseService } from '@/core/clickhouse/clickhouse.service'
import { RedisService } from '@/core/redis/redis.service'
import { User, UserDocument } from '../auth/schemas/user.schema'
import { Promocode, PromocodeDocument } from '../promocodes/schemas/promocode.schema'
import { ApplyPromocodeDTO } from './dto/apply-promocode.dto'
import { CreateOrderDTO } from './dto/create-order.dto'
import { Order, OrderDocument } from './schemas/order.schema'
import { PromoUsage, PromoUsageDocument } from './schemas/promo-usage.schema'

@Injectable()
export class OrdersService {
	private readonly logger = new Logger(OrdersService.name)

	constructor(
		@InjectModel(Order.name) private readonly orderModel: Model<OrderDocument>,
		@InjectModel(User.name) private readonly userModel: Model<UserDocument>,
		@InjectModel(PromoUsage.name) private readonly promoUsageModel: Model<PromoUsageDocument>,
		@InjectModel(Promocode.name) private readonly promocodeModel: Model<PromocodeDocument>,
		private readonly clickhouseService: ClickhouseService,
		private readonly redisService: RedisService,
	) {}

	async create(dto: CreateOrderDTO, userId: string): Promise<OrderDocument> {
		const order = await this.orderModel.create({
			userId: new Types.ObjectId(userId),
			amount: dto.amount,
			discount: 0,
			finalAmount: dto.amount,
		})

		const user = await this.userModel.findById(userId).select('-passwordHash')
		if (user) {
			void this.syncOrderToClickHouse(order, user)
		}

		return order
	}

	async findMyOrders(userId: string): Promise<OrderDocument[]> {
		return this.orderModel.find({ userId: new Types.ObjectId(userId) }).sort({ createdAt: -1 })
	}

	async applyPromocode(
		orderId: string,
		dto: ApplyPromocodeDTO,
		userId: string,
	): Promise<OrderDocument> {
		// Step 1: find order
		const order = await this.orderModel.findById(orderId)
		if (!order) throw new NotFoundException('Order not found')

		// Step 2: ownership check
		if (order.userId.toString() !== userId) {
			throw new ForbiddenException('Order does not belong to current user')
		}

		// Step 3: find active promocode
		const promocode = await this.promocodeModel.findOne({
			code: dto.promocodeCode,
			isActive: true,
		})
		if (!promocode) throw new NotFoundException('Promocode not found or inactive')

		const promocodeId = promocode._id as Types.ObjectId

		// Step 4: check duplicate usage on this order
		const alreadyApplied = await this.promoUsageModel.exists({ orderId, promocodeId })
		if (alreadyApplied) throw new ConflictException('Promocode already applied to this order')

		// Step 5: total usage limit
		const totalUsed = await this.promoUsageModel.countDocuments({ promocodeId })
		if (totalUsed >= promocode.totalLimit) {
			throw new UnprocessableEntityException('Promocode total usage limit reached')
		}

		// Step 6: per-user usage limit
		const userUsed = await this.promoUsageModel.countDocuments({
			promocodeId,
			userId: new Types.ObjectId(userId),
		})
		if (userUsed >= promocode.userLimit) {
			throw new UnprocessableEntityException('Promocode user usage limit reached')
		}

		// Step 7: date validity
		const now = new Date()
		if (promocode.dateFrom && now < promocode.dateFrom) {
			throw new UnprocessableEntityException('Promocode is not yet valid')
		}
		if (promocode.dateTo && now > promocode.dateTo) {
			throw new UnprocessableEntityException('Promocode has expired')
		}

		// Step 8: acquire distributed lock
		const lockKey = `lock:promocode:${promocodeId.toString()}`
		const locked = await this.redisService.acquireLock(lockKey, 10000)
		if (!locked) throw new ConflictException('Promocode is being processed, please retry')

		let promoUsage: PromoUsageDocument
		try {
			// Step 9 [LOCKED]: create PromoUsage and update Order
			const user = await this.userModel.findById(order.userId)
			const discountAmount = (order.amount * promocode.discount) / 100
			const finalAmount = order.amount - discountAmount

			promoUsage = await this.promoUsageModel.create({
				promocodeId,
				promocodeCode: promocode.code,
				promocodeDiscount: promocode.discount,
				userId: new Types.ObjectId(userId),
				userName: user?.name ?? '',
				userEmail: user?.email ?? '',
				orderId: new Types.ObjectId(orderId),
				orderAmount: order.amount,
				discountAmount,
			})

			await this.orderModel.findByIdAndUpdate(orderId, {
				promocodeId,
				discount: promocode.discount,
				discountAmount,
				finalAmount,
			})
		} finally {
			// Step 10: always release lock
			await this.redisService.releaseLock(lockKey)
		}

		// Step 11: fire-and-forget CH sync
		const updatedOrder = await this.orderModel.findById(orderId)
		void this.syncPromoUsageToClickHouse(updatedOrder!, promoUsage)

		return updatedOrder!
	}

	private async syncPromoUsageToClickHouse(
		_order: OrderDocument,
		promoUsage: PromoUsageDocument,
	): Promise<void> {
		try {
			const doc = promoUsage.toObject() as { createdAt?: Date }
			await this.clickhouseService.insert('promo_usages', [
				{
					id: promoUsage._id.toString(),
					promocodeId: promoUsage.promocodeId.toString(),
					promocodeCode: promoUsage.promocodeCode,
					promocodeDiscount: promoUsage.promocodeDiscount,
					userId: promoUsage.userId.toString(),
					userName: promoUsage.userName,
					userEmail: promoUsage.userEmail,
					orderId: promoUsage.orderId.toString(),
					orderAmount: promoUsage.orderAmount,
					discountAmount: promoUsage.discountAmount,
					createdAt: this.formatDate(doc.createdAt),
				},
			])
		} catch (err: unknown) {
			this.logger.error(
				`Failed to sync promo usage ${promoUsage._id.toString()} to ClickHouse: ${err instanceof Error ? err.message : String(err)}`,
			)
		}
	}

	private formatDate(date: Date | string | null | undefined): string | null {
		if (!date) return null
		return new Date(date).toISOString().replace('T', ' ').substring(0, 19)
	}

	async syncOrderToClickHouse(order: OrderDocument, user: UserDocument): Promise<void> {
		try {
			const doc = order.toObject() as { createdAt?: Date; updatedAt?: Date }
			await this.clickhouseService.insert('orders', [
				{
					id: order._id.toString(),
					userId: order.userId.toString(),
					userName: user.name,
					userEmail: user.email,
					amount: order.amount,
					discount: order.discount,
					finalAmount: order.finalAmount,
					promocodeId: order.promocodeId ? order.promocodeId.toString() : null,
					promocodeCode: null,
					createdAt: this.formatDate(doc.createdAt),
					updatedAt: this.formatDate(doc.updatedAt),
				},
			])
		} catch (err: unknown) {
			this.logger.error(
				`Failed to sync order ${order._id.toString()} to ClickHouse: ${err instanceof Error ? err.message : String(err)}`,
			)
		}
	}
}
