import { Routes, Route, Navigate, Outlet } from 'react-router-dom'
import { Sidebar } from '@/widgets/sidebar'
import { authApi } from '@/features/auth'
import { LoginPage } from '@/pages/login'
import { RegisterPage } from '@/pages/register'
import { DashboardPage } from '@/pages/dashboard'
import { UsersPage } from '@/pages/users'
import { PromocodesPage } from '@/pages/promocodes'
import { OrdersPage } from '@/pages/orders'
import { PromoUsagesPage } from '@/pages/promo-usages'
import { UsersIntelligencePage } from '@/pages/users-intelligence'
import { PromocodesLifecyclePage } from '@/pages/promocodes-lifecycle'
import { ProtectedRoute } from './ProtectedRoute'

function Layout() {
	return (
		<div className='flex h-screen bg-background'>
			<Sidebar />
			<main className='flex-1 overflow-auto p-6'>
				<Outlet />
			</main>
		</div>
	)
}

export function AppRouter() {
	const isAuthenticated = authApi.isAuthenticated()

	return (
		<Routes>
			<Route
				path='/login'
				element={isAuthenticated ? <Navigate to='/' replace /> : <LoginPage />}
			/>
			<Route
				path='/register'
				element={isAuthenticated ? <Navigate to='/' replace /> : <RegisterPage />}
			/>

			<Route element={<ProtectedRoute />}>
				<Route element={<Layout />}>
					<Route path='/' element={<DashboardPage />} />
					<Route path='/users' element={<UsersPage />} />
					<Route path='/promocodes' element={<PromocodesPage />} />
					<Route path='/orders' element={<OrdersPage />} />
					<Route path='/promo-usages' element={<PromoUsagesPage />} />
					<Route path='/users-intelligence' element={<UsersIntelligencePage />} />
					<Route path='/promocodes-lifecycle' element={<PromocodesLifecyclePage />} />
				</Route>
			</Route>

			<Route path='*' element={<Navigate to='/' replace />} />
		</Routes>
	)
}
