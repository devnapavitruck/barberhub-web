// src/hooks/useBarberoReservas.ts

import {
  useQuery,
  useMutation,
  useQueryClient,
  UseQueryResult,
  UseMutationResult,
} from '@tanstack/react-query'

export interface Reserva {
  id: number
  cliente: { clientePerfil: { nombres: string }; email: string }
  servicio: { nombre: string }
  fecha: string
  hora: string
  estado: 'PENDING' | 'CONFIRMED' | 'CANCELLED'
}

// 1) Listar reservas pendientes de hoy
export function useReservasHoy(): UseQueryResult<Reserva[], Error> {
  return useQuery<Reserva[], Error>({
    queryKey: ['reservasHoy'],
    queryFn: async (): Promise<Reserva[]> => {
      const res = await fetch('/api/barbero/reservas?status=PENDING', {
        headers: { 'Content-Type': 'application/json' },
      })
      if (!res.ok) throw new Error('No se pudieron cargar las reservas de hoy')
      return res.json()
    },
    staleTime: 1000 * 60 * 5,
  })
}

// 2) Listar próximas reservas (confirmadas y futuras)
export function useReservasProximas(): UseQueryResult<Reserva[], Error> {
  return useQuery<Reserva[], Error>({
    queryKey: ['reservasProximas'],
    queryFn: async (): Promise<Reserva[]> => {
      const res = await fetch('/api/barbero/reservas?status=CONFIRMED', {
        headers: { 'Content-Type': 'application/json' },
      })
      if (!res.ok) throw new Error('No se pudieron cargar las próximas reservas')
      const arr: Reserva[] = await res.json()
      const hoy = new Date()
      return arr.filter((r) => new Date(r.fecha) > hoy)
    },
    staleTime: 1000 * 60 * 5,
  })
}

// 3) Mutación para confirmar o cancelar una reserva
export function useActualizarReserva(): UseMutationResult<
  Reserva,
  Error,
  { id: number; action: 'CONFIRMED' | 'CANCELLED' }
> {
  const queryClient = useQueryClient()

  return useMutation<Reserva, Error, { id: number; action: 'CONFIRMED' | 'CANCELLED' }>({
    // mutationFn dentro de options en lugar de primer parámetro
    mutationFn: async (variables): Promise<Reserva> => {
      const { id, action } = variables
      const res = await fetch(`/api/barbero/reservas/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ action }),
      })
      if (!res.ok) throw new Error('Error actualizando reserva')
      return res.json()
    },
    onSuccess: () => {
      // invalidar ambos queries
      queryClient.invalidateQueries({ queryKey: ['reservasHoy'] })
      queryClient.invalidateQueries({ queryKey: ['reservasProximas'] })
    },
  })
}
