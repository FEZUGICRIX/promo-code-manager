import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../model/useAuth'
import { getErrorMessage } from '@/shared/lib'
import { registerSchema, type RegisterFormData as FormData } from '../model/auth.schema'

// TODO: Вынести в отдельный файл
const fields = [
	{ name: 'name' as const, label: 'Имя', type: 'text', placeholder: 'Иван Иванов' },
	{ name: 'email' as const, label: 'Email', type: 'email', placeholder: 'you@example.com' },
	{ name: 'phone' as const, label: 'Телефон', type: 'tel', placeholder: '+79001234567' },
	{ name: 'password' as const, label: 'Пароль', type: 'password', placeholder: '••••••••' },
]

export function RegisterForm() {
	const { register: registerUser } = useAuth()
	const navigate = useNavigate()

	const {
		register,
		handleSubmit,
		setError,
		formState: { errors, isSubmitting },
	} = useForm<FormData>({ resolver: zodResolver(registerSchema) })

	const onSubmit = async (data: FormData) => {
		try {
			await registerUser(data)
			navigate('/')
		} catch (err) {
			setError('root', { message: getErrorMessage(err) })
		}
	}

	return (
		<div className='min-h-screen flex items-center justify-center bg-background'>
			<div className='w-full max-w-sm space-y-6 p-8 border rounded-lg bg-card shadow-sm'>
				<div>
					<h2 className='text-2xl font-semibold'>Регистрация</h2>
					<p className='text-sm text-muted-foreground mt-1'>Создайте новый аккаунт</p>
				</div>

				<form onSubmit={handleSubmit(onSubmit)} className='space-y-4'>
					{fields.map(({ name, label, type, placeholder }) => (
						<div key={name} className='space-y-1'>
							<label className='text-sm font-medium'>{label}</label>
							<input
								{...register(name)}
								type={type}
								placeholder={placeholder}
								className='w-full px-3 py-2 border rounded-md text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring'
							/>
							{errors[name] && <p className='text-xs text-destructive'>{errors[name]?.message}</p>}
						</div>
					))}

					{errors.root && (
						<p className='text-xs text-destructive bg-destructive/10 px-3 py-2 rounded-md'>
							{errors.root.message}
						</p>
					)}

					<button
						type='submit'
						disabled={isSubmitting}
						className='w-full py-2 px-4 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors'
					>
						{isSubmitting ? 'Регистрация...' : 'Зарегистрироваться'}
					</button>
				</form>

				<p className='text-sm text-center text-muted-foreground'>
					Уже есть аккаунт?{' '}
					<Link to='/login' className='text-primary hover:underline'>
						Войти
					</Link>
				</p>
			</div>
		</div>
	)
}
