import { Navigate, Outlet } from 'react-router-dom'
import { authApi } from '@/features/auth'

export function ProtectedRoute() {
	if (!authApi.isAuthenticated()) {
		return <Navigate to='/login' replace />
	}
	return <Outlet />
}
