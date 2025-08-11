import { useMutation, useQueryClient } from '@tanstack/react-query'

export interface ReservaInput {
  userId: number
  barberoId: number
  servicioId: number
  fecha: string
  hora: string
  notas?: string
}

export function useClienteReservas() {
  const qc = useQueryClient()
  return useMutation<any, Error, ReservaInput>({
    mutationFn: async (input) => {
      const res = await fetch('/api/cliente/reservas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      })
      if (!res.ok) throw new Error('No se pudo crear la reserva')
      return res.json()
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['misReservas'] })
    },
  })
}

export default useClienteReservas
