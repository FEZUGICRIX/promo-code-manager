import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { api } from '@/shared/api/instance'

export function useDeactivateUser() {
	const queryClient = useQueryClient()

	return useMutation({
		mutationFn: (id: string) => api.delete(`/users/${id}`),

		onError: (error) => {
			toast.error('Не удалось деактивировать пользователя', {
				description: error instanceof Error ? error.message : 'Попробуйте снова',
			})
		},

		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['analytics', 'users'] })
			toast.success('Пользователь успешно деактивирован')
		},
	})
}
