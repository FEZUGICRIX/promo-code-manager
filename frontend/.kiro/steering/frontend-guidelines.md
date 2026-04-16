---
inclusion: auto
---

# Frontend Development Guidelines

## Package Manager

**ВСЕГДА ИСПОЛЬЗУЙ pnpm** для установки зависимостей и запуска скриптов!

- `pnpm install` вместо `npm install`
- `pnpm add <package>` вместо `npm install <package>`
- `pnpm run <script>` вместо `npm run <script>`

## Архитектура

### Структура проекта

```
src/
├── components/
│   ├── ui/              # shadcn/ui компоненты
│   ├── layout/          # Layout компоненты
│   └── tables/          # Таблицы с TanStack Table
├── pages/
│   ├── auth/            # Login, Register
│   ├── dashboard/       # Главная
│   ├── users/           # Таблица пользователей
│   ├── promocodes/      # Таблица промокодов
│   └── orders/          # Заказы
├── lib/
│   ├── api.ts           # Axios instance
│   ├── auth.ts          # Auth helpers
│   └── utils.ts         # Утилиты
├── hooks/
│   └── use-auth.ts      # Auth hook
├── types/
│   └── index.ts         # TypeScript типы
└── main.tsx
```

## React Best Practices

### Компоненты

- Используй функциональные компоненты + hooks
- Один компонент = один файл
- Именуй компоненты в PascalCase
- Props типизируй интерфейсами

### Hooks

- `useState` для локального состояния
- `useEffect` для side effects
- `useMemo` для дорогих вычислений
- `useCallback` для стабильных функций
- Кастомные hooks начинаются с `use`

## TanStack Table (Server-Side)

### Обязательные фичи

1. **Server-side пагинация** - данные загружаются постранично
2. **Server-side сортировка** - сортировка на бэкенде
3. **Server-side фильтрация** - фильтры отправляются на бэкенд
4. **Глобальный фильтр по датам** - применяется ко всем таблицам

### Пример таблицы

```typescript
const table = useReactTable({
	data,
	columns,
	pageCount: Math.ceil(totalCount / pageSize),
	state: {
		pagination: { pageIndex, pageSize },
		sorting,
		columnFilters,
	},
	onPaginationChange: setPagination,
	onSortingChange: setSorting,
	onColumnFiltersChange: setColumnFilters,
	getCoreRowModel: getCoreRowModel(),
	manualPagination: true, // ВАЖНО!
	manualSorting: true, // ВАЖНО!
	manualFiltering: true, // ВАЖНО!
})
```

### Query параметры для API

```typescript
const params = {
	page: pageIndex + 1,
	pageSize,
	sortBy: sorting[0]?.id,
	sortOrder: sorting[0]?.desc ? 'desc' : 'asc',
	dateFrom: filters.dateFrom,
	dateTo: filters.dateTo,
	// ... другие фильтры
}
```

### НИКОГДА не делай

❌ `findAll()` без лимита - загрузка всех данных в память
❌ Пагинация на клиенте - `getPaginationRowModel()`
❌ Сортировка на клиенте - `getSortedRowModel()`
❌ Фильтрация на клиенте - `getFilteredRowModel()`

## TanStack Query (React Query)

### Для всех API запросов

```typescript
const { data, isLoading, error } = useQuery({
	queryKey: ['users', page, sortBy, dateFrom, dateTo],
	queryFn: () => api.getUsers({ page, sortBy, dateFrom, dateTo }),
	staleTime: 30000, // 30 секунд
})
```

### Мутации

```typescript
const mutation = useMutation({
	mutationFn: api.createPromocode,
	onSuccess: () => {
		queryClient.invalidateQueries({ queryKey: ['promocodes'] })
		toast.success('Промокод создан')
	},
	onError: (error) => {
		toast.error(error.message)
	},
})
```

### Инвалидация кэша

После мутаций ВСЕГДА инвалидируй связанные запросы:

```typescript
queryClient.invalidateQueries({ queryKey: ['promocodes'] })
queryClient.invalidateQueries({ queryKey: ['analytics'] })
```

## Формы (React Hook Form + Zod)

### Валидация схемы

```typescript
const schema = z.object({
	email: z.string().email('Некорректный email'),
	password: z.string().min(8, 'Минимум 8 символов'),
	name: z.string().min(2, 'Минимум 2 символа'),
	phone: z.string().regex(/^\+?[0-9]{10,15}$/, 'Некорректный телефон'),
})
```

### Использование формы

```typescript
const form = useForm({
	resolver: zodResolver(schema),
	defaultValues: { email: '', password: '' },
})

const onSubmit = async (data) => {
	try {
		await mutation.mutateAsync(data)
	} catch (error) {
		form.setError('root', { message: error.message })
	}
}
```

## Глобальный фильтр по датам

### Пресеты

- "Сегодня" - `startOfDay(new Date())` до `endOfDay(new Date())`
- "Последние 7 дней" - `subDays(new Date(), 7)` до `new Date()`
- "Последние 30 дней" - `subDays(new Date(), 30)` до `new Date()`
- "Произвольный" - DatePicker с выбором диапазона

### Применение

Фильтр должен применяться ко ВСЕМ аналитическим таблицам:

- Таблица пользователей
- Таблица промокодов
- История использований

## Авторизация

### JWT токены

- Access token хранится в `localStorage` или `sessionStorage`
- Refresh token хранится в `httpOnly cookie` (если поддерживается) или `localStorage`
- При 401 ошибке - попытка обновить токен
- При неудаче - редирект на `/login`

### Защита роутов

```typescript
<Route element={<ProtectedRoute />}>
  <Route path="/dashboard" element={<Dashboard />} />
  <Route path="/users" element={<UsersPage />} />
  {/* ... */}
</Route>
```

### ProtectedRoute компонент

```typescript
const ProtectedRoute = () => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) return <Loader />;
  if (!isAuthenticated) return <Navigate to="/login" />;

  return <Outlet />;
};
```

## API Client (Axios)

### Базовая настройка

```typescript
const api = axios.create({
	baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000',
	headers: { 'Content-Type': 'application/json' },
})

// Interceptor для токена
api.interceptors.request.use((config) => {
	const token = localStorage.getItem('accessToken')
	if (token) config.headers.Authorization = `Bearer ${token}`
	return config
})

// Interceptor для обработки 401
api.interceptors.response.use(
	(response) => response,
	async (error) => {
		if (error.response?.status === 401) {
			// Попытка обновить токен
			try {
				const { data } = await axios.post('/auth/refresh')
				localStorage.setItem('accessToken', data.accessToken)
				return api.request(error.config)
			} catch {
				localStorage.clear()
				window.location.href = '/login'
			}
		}
		return Promise.reject(error)
	},
)
```

## Обработка ошибок

### Toast уведомления

```typescript
import { toast } from 'sonner' // или react-hot-toast

// Success
toast.success('Промокод создан успешно')

// Error
toast.error(error.response?.data?.message || 'Произошла ошибка')

// Loading
const toastId = toast.loading('Загрузка...')
toast.success('Готово!', { id: toastId })
```

### Отображение ошибок API

- Показывай понятные сообщения пользователю
- Логируй детали в консоль для отладки
- Используй разные стили для разных типов (error/success/warning)

## TypeScript

### Strict mode

- Включен в `tsconfig.json`
- НЕТ `any` в коде
- Типизируй ВСЕ props, state, API responses
- Используй `unknown` для неизвестных типов

### Типы для API

```typescript
interface User {
	id: string
	email: string
	name: string
	phone: string
	isActive: boolean
	createdAt: string
}

interface PaginatedResponse<T> {
	data: T[]
	total: number
	page: number
	pageSize: number
}

interface ApiError {
	message: string
	statusCode: number
	error?: string
}
```

## Styling (Tailwind CSS)

### Утилиты

```typescript
import { cn } from '@/lib/utils';

// Объединение классов
<div className={cn('base-class', isActive && 'active-class')} />
```

### Responsive

```typescript
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3" />
```

### Dark mode (опционально)

```typescript
<div className="bg-white dark:bg-gray-900" />
```

## Команды для разработки

```bash
# Установка зависимостей
pnpm install

# Разработка
pnpm run dev

# Сборка
pnpm run build

# Превью продакшн сборки
pnpm run preview

# Линтинг
pnpm run lint
```

## Checklist перед коммитом

- [ ] Все таблицы используют server-side операции
- [ ] Глобальный фильтр по датам работает
- [ ] Формы имеют валидацию (Zod)
- [ ] Ошибки API отображаются пользователю
- [ ] Защищенные роуты требуют авторизации
- [ ] Нет `any` в TypeScript
- [ ] Loading состояния показываются
- [ ] Токены обновляются при 401
- [ ] Кэш инвалидируется после мутаций
- [ ] Responsive дизайн работает
