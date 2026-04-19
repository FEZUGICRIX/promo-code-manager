import { NavLink } from 'react-router-dom'
import { LayoutDashboard, Users, Tag, ShoppingCart, History, LogOut, BarChart } from 'lucide-react'
import { cn } from '@/shared/lib'
import { useAuth } from '@/features/auth'

const navItems = [
	{ to: '/', label: 'Дашборд', icon: LayoutDashboard },
	{ to: '/users', label: 'Пользователи', icon: Users },
	{ to: '/promocodes', label: 'Промокоды', icon: Tag },
	{ to: '/orders', label: 'Заказы', icon: ShoppingCart },
	{ to: '/promo-usages', label: 'История', icon: History },
	{ to: '/users-intelligence', label: 'Users Intelligence', icon: BarChart },
]

export function Sidebar() {
	const { logout } = useAuth()

	return (
		<aside className='w-56 border-r bg-card flex flex-col'>
			<div className='p-4 border-b'>
				<h1 className='font-semibold text-lg'>PromoCode Manager</h1>
			</div>

			<nav className='flex-1 p-2 space-y-1'>
				{navItems.map(({ to, label, icon: Icon }) => (
					<NavLink
						key={to}
						to={to}
						end={to === '/'}
						className={({ isActive }) =>
							cn(
								'flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors',
								isActive
									? 'bg-primary text-primary-foreground'
									: 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
							)
						}
					>
						<Icon size={16} />
						{label}
					</NavLink>
				))}
			</nav>

			<div className='p-2 border-t'>
				<button
					onClick={logout}
					className='flex items-center gap-3 px-3 py-2 rounded-md text-sm text-muted-foreground hover:bg-accent hover:text-accent-foreground w-full transition-colors'
				>
					<LogOut size={16} />
					Выйти
				</button>
			</div>
		</aside>
	)
}
