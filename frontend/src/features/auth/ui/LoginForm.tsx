import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../model/useAuth'
import { getErrorMessage } from '@/shared/lib'
import { loginSchema, type LoginFormData as FormData } from '../model/auth.schema'

export function LoginForm() {
	const { login } = useAuth()
	const navigate = useNavigate()

	const {
		register,
		handleSubmit,
		setError,
		formState: { errors, isSubmitting },
	} = useForm<FormData>({ resolver: zodResolver(loginSchema) })

	const onSubmit = async (data: FormData) => {
		try {
			await login(data)
			navigate('/')
		} catch (err) {
			setError('root', { message: getErrorMessage(err) })
		}
	}

	return (
		<div className='min-h-screen flex items-center justify-center bg-background'>
			<div className='w-full max-w-sm space-y-6 p-8 border rounded-lg bg-card shadow-sm'>
				<div>
					<h2 className='text-2xl font-semibold'>Вход</h2>
					<p className='text-sm text-muted-foreground mt-1'>Войдите в свой аккаунт</p>
				</div>

				<form onSubmit={handleSubmit(onSubmit)} className='space-y-4'>
					<div className='space-y-1'>
						<label className='text-sm font-medium'>Email</label>
						<input
							{...register('email')}
							type='email'
							placeholder='you@example.com'
							className='w-full px-3 py-2 border rounded-md text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring'
						/>
						{errors.email && <p className='text-xs text-destructive'>{errors.email.message}</p>}
					</div>

					<div className='space-y-1'>
						<label className='text-sm font-medium'>Пароль</label>
						<input
							{...register('password')}
							type='password'
							placeholder='••••••••'
							className='w-full px-3 py-2 border rounded-md text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring'
						/>
						{errors.password && (
							<p className='text-xs text-destructive'>{errors.password.message}</p>
						)}
					</div>

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
						{isSubmitting ? 'Вход...' : 'Войти'}
					</button>
				</form>

				<p className='text-sm text-center text-muted-foreground'>
					Нет аккаунта?{' '}
					<Link to='/register' className='text-primary hover:underline'>
						Зарегистрироваться
					</Link>
				</p>
			</div>
		</div>
	)
}
