# Analytics Module Architecture

## Overview

The Analytics module provides read-only access to aggregated data from ClickHouse for dashboard tables and summary metrics. It follows SOLID principles with clear separation of concerns.

## Architecture

```
AnalyticsService (Coordinator)
    ├── QueryBuilders (SQL generation)
    │   ├── UsersQueryBuilder
    │   ├── PromocodesQueryBuilder
    │   └── PromoUsagesQueryBuilder
    │
    ├── Helpers (Cross-cutting concerns)
    │   ├── CacheHelper (Redis caching)
    │   ├── QueryExecutorHelper (ClickHouse execution)
    │   └── DateRangeHelper (Date resolution)
    │
    └── DTOs & Interfaces (Type safety)
```

## Key Design Decisions

### 1. Query Optimization (Critical Fix)

**Problem:** Original queries used `LEFT JOIN` before pagination, causing:

- Row multiplication (1 user with 3 orders = 3 rows)
- Incorrect counts (`count()` counted duplicates)
- Performance degradation (joining entire tables before LIMIT)

**Solution:** CTE-based approach

```sql
WITH
    base_users AS (
        -- Filter and paginate FIRST
        SELECT * FROM users
        WHERE conditions
        LIMIT 10 OFFSET 0
    )
SELECT
    u.*,
    -- Aggregate ONLY for selected users via subqueries
    (SELECT count() FROM orders WHERE userId = u.id) AS totalOrders
FROM base_users u
```

**Benefits:**

- Correct counts (no duplicates)
- Better performance (paginate first, aggregate second)
- Cleaner SQL (no complex GROUP BY with all columns)

### 2. Average Check Calculation

**Fixed Formula:**

```
averageCheck = sum(order.amount) / uniq(userId with orders)
```

**Not:**

- ~~`sum(amount) / count(orders)`~~ (gives average order size, not per-user)
- ~~`sum(amount) / count(users)`~~ (includes users without orders)

### 3. User Status Handling

**Problem:** Users table may contain history of status changes (multiple rows per user).

**Solution:** Use `argMax(isActive, updatedAt)` to get latest status:

```sql
SELECT
    id,
    argMax(isActive, updatedAt) as last_status
FROM users
GROUP BY id
```

### 4. Separation of Concerns

**Before (God Object):**

- 500+ lines in one file
- Mixed SQL, caching, execution, date logic
- Hard to test and maintain

**After (SOLID):**

- `AnalyticsService`: 130 lines, only coordination
- `QueryBuilders`: Pure SQL generation, no side effects
- `Helpers`: Reusable, testable utilities
- Each class has single responsibility

## File Structure

```
analytics/
├── analytics.service.ts          # Main service (coordinator)
├── analytics.controller.ts       # HTTP endpoints
├── analytics.module.ts            # Module definition
│
├── builders/                      # SQL query builders
│   ├── users.query-builder.ts
│   ├── promocodes.query-builder.ts
│   ├── promo-usages.query-builder.ts
│   ├── types.ts
│   └── index.ts
│
├── helpers/                       # Utility classes
│   ├── cache.helper.ts           # Redis caching logic
│   ├── query-executor.helper.ts  # ClickHouse execution
│   ├── date-range.helper.ts      # Date resolution
│   └── index.ts
│
├── dto/                           # Request DTOs
│   ├── analytics-query.dto.ts    # Base DTO
│   ├── users-query.dto.ts
│   ├── promocodes-query.dto.ts
│   └── promo-usages-query.dto.ts
│
└── interfaces/                    # Response interfaces
    ├── analytics-user.interface.ts
    ├── analytics-promocode.interface.ts
    ├── analytics-promo-usage.interface.ts
    ├── paginated-response.interface.ts
    └── users-summary-response.interface.ts
```

## Usage Examples

### Get Users with Analytics

```typescript
const users = await analyticsService.getUsers({
	page: 1,
	pageSize: 10,
	sortBy: 'totalSpent',
	sortOrder: SortOrder.DESC,
	isActive: true,
	search: 'john',
	dateFrom: '2024-01-01 00:00:00',
	dateTo: '2024-12-31 23:59:59',
})
```

### Get Summary Metrics

```typescript
const summary = await analyticsService.getUsersSummary('2024-01-01 00:00:00', '2024-12-31 23:59:59')
// { totalUsers: 100, activeUsers: 85, averageCheck: 1250.50 }
```

## Caching Strategy

- **TTL:** 60 seconds
- **Key format:** `analytics:{endpoint}:{sorted_params}`
- **Graceful degradation:** If Redis fails, queries execute without caching
- **Cache invalidation:** Automatic via TTL (no manual invalidation needed for read-only analytics)

## Testing Strategy

### Unit Tests

- Query builders (pure functions, easy to test)
- Helpers (isolated logic)

### Integration Tests

- Full flow: DTO → Service → ClickHouse → Response
- Cache behavior (hit/miss/failure)
- Error handling

## Performance Considerations

1. **Pagination first:** Filter and paginate before aggregations
2. **Subqueries over JOINs:** Avoid row multiplication
3. **Redis caching:** 60s TTL reduces ClickHouse load
4. **Parameterized queries:** Prevent SQL injection, enable query plan caching
5. **Date range defaults:** 30 days to limit data volume

## Future Improvements

- [ ] Add query result streaming for large datasets
- [ ] Implement query timeout handling
- [ ] Add metrics/monitoring (query duration, cache hit rate)
- [ ] Consider materialized views for frequently accessed aggregations
- [ ] Add query result compression for large responses
