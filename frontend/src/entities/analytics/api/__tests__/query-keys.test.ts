import { describe, it, expect } from 'vitest'
import { createAnalyticsQueryKey } from '../query-keys'

describe('createAnalyticsQueryKey', () => {
	it('should generate query key with endpoint and params', () => {
		const endpoint = '/analytics/users'
		const params = { page: 1, pageSize: 10 }

		const result = createAnalyticsQueryKey(endpoint, params)

		expect(result).toEqual(['analytics', '/analytics/users', { page: 1, pageSize: 10 }])
	})

	it('should generate unique keys for different endpoints', () => {
		const params = { page: 1, pageSize: 10 }

		const key1 = createAnalyticsQueryKey('/analytics/users', params)
		const key2 = createAnalyticsQueryKey('/analytics/promocodes', params)

		expect(key1).not.toEqual(key2)
		expect(key1[1]).toBe('/analytics/users')
		expect(key2[1]).toBe('/analytics/promocodes')
	})

	it('should generate unique keys for different params', () => {
		const endpoint = '/analytics/users'

		const key1 = createAnalyticsQueryKey(endpoint, { page: 1, pageSize: 10 })
		const key2 = createAnalyticsQueryKey(endpoint, { page: 2, pageSize: 10 })

		expect(key1).not.toEqual(key2)
		expect(key1[2]).toEqual({ page: 1, pageSize: 10 })
		expect(key2[2]).toEqual({ page: 2, pageSize: 10 })
	})

	it('should handle empty params', () => {
		const endpoint = '/analytics/users'
		const params = {}

		const result = createAnalyticsQueryKey(endpoint, params)

		expect(result).toEqual(['analytics', '/analytics/users', {}])
	})

	it('should handle complex params with nested objects', () => {
		const endpoint = '/analytics/users'
		const params = {
			page: 1,
			pageSize: 10,
			search: 'test',
			sortBy: 'name',
			sortOrder: 'ASC',
			dateFrom: '2024-01-01',
			dateTo: '2024-01-31',
		}

		const result = createAnalyticsQueryKey(endpoint, params)

		expect(result[0]).toBe('analytics')
		expect(result[1]).toBe('/analytics/users')
		expect(result[2]).toEqual(params)
	})
})
