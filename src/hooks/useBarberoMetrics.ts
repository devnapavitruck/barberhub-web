// src/hooks/useBarberoMetrics.ts

import { useQuery, UseQueryResult } from '@tanstack/react-query'

export interface BarberoMetrics {
  reservasMes: number
  ocupacion: number
  rating: number
}

// Hook para obtener métricas del barbero
export function useBarberoMetrics(): UseQueryResult<BarberoMetrics, Error> {
  return useQuery<BarberoMetrics, Error>({
    queryKey: ['barberoMetrics'],
    queryFn: async () => {
      const res = await fetch('/api/barbero/metrics', {
        headers: { 'Content-Type': 'application/json' },
      })
      if (!res.ok) throw new Error('No se pudieron cargar las métricas')
      return res.json()
    },
    staleTime: 1000 * 60 * 5,
  })
}
