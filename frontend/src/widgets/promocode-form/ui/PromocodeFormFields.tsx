import { UseFormRegister, FieldErrors, UseFormWatch } from 'react-hook-form'
import type { PromocodeFormData } from '@/entities/promocode/model/types'
import { DiscountType } from '@/entities/promocode/model/types'

interface PromocodeFormFieldsProps {
	register: UseFormRegister<PromocodeFormData>
	errors: FieldErrors<PromocodeFormData>
	isEditMode: boolean
	watch: UseFormWatch<PromocodeFormData>
}

export function PromocodeFormFields({
	register,
	errors,
	isEditMode,
	watch,
}: PromocodeFormFieldsProps) {
	const discountType = watch('discountType')
	const isPercentage = discountType === DiscountType.PERCENTAGE

	return (
		<div className='space-y-4'>
			{/* Code Field */}
			<div>
				<label htmlFor='code' className='block text-sm font-medium text-gray-700 mb-1'>
					Код промокода *
				</label>
				<input
					id='code'
					type='text'
					{...register('code')}
					readOnly={isEditMode}
					className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
						isEditMode ? 'bg-gray-100 cursor-not-allowed' : ''
					} ${errors.code ? 'border-red-500' : 'border-gray-300'}`}
					placeholder='Например: SUMMER2024'
				/>
				{errors.code && <p className='text-sm text-red-600 mt-1'>{errors.code.message}</p>}
			</div>

			{/* Discount Type + Discount Fields */}
			<div className='flex gap-3'>
				<div className='w-40 shrink-0'>
					<label htmlFor='discountType' className='block text-sm font-medium text-gray-700 mb-1'>
						Тип скидки *
					</label>
					<select
						id='discountType'
						{...register('discountType')}
						className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white ${
							errors.discountType ? 'border-red-500' : 'border-gray-300'
						}`}
					>
						<option value={DiscountType.PERCENTAGE}>% Процент</option>
						<option value={DiscountType.FIXED}>₽ Фиксированная</option>
					</select>
					{errors.discountType && (
						<p className='text-sm text-red-600 mt-1'>{errors.discountType.message}</p>
					)}
				</div>

				<div className='flex-1'>
					<label htmlFor='discount' className='block text-sm font-medium text-gray-700 mb-1'>
						Скидка {isPercentage ? '(%)' : '(₽)'} *
					</label>
					<input
						id='discount'
						type='number'
						{...register('discount', { valueAsNumber: true })}
						className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
							errors.discount ? 'border-red-500' : 'border-gray-300'
						}`}
						placeholder={isPercentage ? 'От 1 до 100' : 'Сумма в рублях'}
						min='1'
						max={isPercentage ? '100' : undefined}
					/>
					{errors.discount && (
						<p className='text-sm text-red-600 mt-1'>{errors.discount.message}</p>
					)}
				</div>
			</div>

			{/* Total Limit Field */}
			<div>
				<label htmlFor='totalLimit' className='block text-sm font-medium text-gray-700 mb-1'>
					Общий лимит использований *
				</label>
				<input
					id='totalLimit'
					type='number'
					{...register('totalLimit', { valueAsNumber: true })}
					className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
						errors.totalLimit ? 'border-red-500' : 'border-gray-300'
					}`}
					placeholder='Например: 1000'
					min='1'
				/>
				{errors.totalLimit && (
					<p className='text-sm text-red-600 mt-1'>{errors.totalLimit.message}</p>
				)}
			</div>

			{/* User Limit Field */}
			<div>
				<label htmlFor='userLimit' className='block text-sm font-medium text-gray-700 mb-1'>
					Лимит на пользователя *
				</label>
				<input
					id='userLimit'
					type='number'
					{...register('userLimit', { valueAsNumber: true })}
					className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
						errors.userLimit ? 'border-red-500' : 'border-gray-300'
					}`}
					placeholder='Например: 1'
					min='1'
				/>
				{errors.userLimit && (
					<p className='text-sm text-red-600 mt-1'>{errors.userLimit.message}</p>
				)}
			</div>

			{/* DateTo (Expiration) Field */}
			<div>
				<label htmlFor='dateTo' className='block text-sm font-medium text-gray-700 mb-1'>
					Дата истечения *
				</label>
				<input
					id='dateTo'
					type='date'
					{...register('dateTo')}
					className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
						errors.dateTo ? 'border-red-500' : 'border-gray-300'
					}`}
				/>
				{errors.dateTo && <p className='text-sm text-red-600 mt-1'>{errors.dateTo.message}</p>}
			</div>

			{/* DateFrom Field */}
			<div>
				<label htmlFor='dateFrom' className='block text-sm font-medium text-gray-700 mb-1'>
					Дата начала *
				</label>
				<input
					id='dateFrom'
					type='date'
					{...register('dateFrom')}
					className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
						errors.dateFrom ? 'border-red-500' : 'border-gray-300'
					}`}
				/>
				{errors.dateFrom && <p className='text-sm text-red-600 mt-1'>{errors.dateFrom.message}</p>}
			</div>
		</div>
	)
}
