// ─── Pagination ───────────────────────────────────────────────────────────────

export interface PaginatedResponse<T> {
	data: T[]
	total: number
	page: number
	pageSize: number
}

export interface TableQueryParams {
	page: number
	pageSize: number
	sortBy?: string
	sortOrder?: 'asc' | 'desc'
	dateFrom?: string
	dateTo?: string
	[key: string]: string | number | boolean | undefined
}

// ─── API Error ────────────────────────────────────────────────────────────────

export interface ApiError {
	message: string | string[]
	statusCode: number
	error?: string
}
