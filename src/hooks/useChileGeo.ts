// src/hooks/useChileGeo.ts
import { useQuery } from '@tanstack/react-query'

export interface Region { codigo: string; nombre: string }
export interface Comuna { codigo: string; nombre: string }

export function useRegiones() {
  return useQuery<Region[], Error>({
    queryKey: ['regiones'],
    queryFn: async () => {
      const res = await fetch('/api/chile/regiones')
      if (!res.ok) throw new Error('No pude cargar regiones')
      return res.json()
    },
    staleTime: 1000 * 60 * 60,
  })
}

export function useComunas(regionCodigo: string | null) {
  return useQuery<Comuna[], Error>({
    queryKey: ['comunas', regionCodigo],
    queryFn: async () => {
      if (!regionCodigo) return []
      const res = await fetch(`/api/chile/comunas?region=${regionCodigo}`)
      if (!res.ok) throw new Error('No pude cargar comunas')
      return res.json()
    },
    enabled: Boolean(regionCodigo),
    staleTime: 1000 * 60 * 30,
  })
}
