import { describe, it, expect } from 'vitest'
import { cleanParams } from '@/shared/lib'

describe('cleanParams', () => {
	it('should remove undefined values', () => {
		const params = {
			page: 1,
			search: undefined,
			pageSize: 10,
		}

		const result = cleanParams(params)

		expect(result).toEqual({ page: 1, pageSize: 10 })
		expect(result).not.toHaveProperty('search')
	})

	it('should remove empty string values', () => {
		const params = {
			page: 1,
			search: '',
			email: 'test@example.com',
		}

		const result = cleanParams(params)

		expect(result).toEqual({ page: 1, email: 'test@example.com' })
		expect(result).not.toHaveProperty('search')
	})

	it('should preserve valid values', () => {
		const params = {
			page: 1,
			pageSize: 10,
			search: 'test',
			sortBy: 'name',
			sortOrder: 'ASC',
			isActive: true,
		}

		const result = cleanParams(params)

		expect(result).toEqual(params)
	})

	it('should preserve zero values', () => {
		const params = {
			page: 0,
			discount: 0,
			count: 0,
		}

		const result = cleanParams(params)

		expect(result).toEqual({ page: 0, discount: 0, count: 0 })
	})

	it('should preserve false boolean values', () => {
		const params = {
			isActive: false,
			isDeleted: false,
		}

		const result = cleanParams(params)

		expect(result).toEqual({ isActive: false, isDeleted: false })
	})

	it('should handle empty object', () => {
		const params = {}

		const result = cleanParams(params)

		expect(result).toEqual({})
	})

	it('should handle object with all undefined values', () => {
		const params = {
			search: undefined,
			sortBy: undefined,
			dateFrom: undefined,
		}

		const result = cleanParams(params)

		expect(result).toEqual({})
	})

	it('should handle mixed valid and invalid values', () => {
		const params = {
			page: 1,
			search: '',
			name: undefined,
			email: 'test@example.com',
			phone: '',
			isActive: true,
			sortBy: undefined,
		}

		const result = cleanParams(params)

		expect(result).toEqual({
			page: 1,
			email: 'test@example.com',
			isActive: true,
		})
	})
})
