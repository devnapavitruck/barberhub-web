// src/hooks/useBarberos.ts

import { useQuery } from '@tanstack/react-query'
import { fetchBarberos, Barbero } from '@/services/api'

/**
 * Hook para obtener la lista de barberos,
 * con filtro opcional por nombre.
 *
 * @param nombre  Cadena de búsqueda en el nombre del barbero
 */
export function useBarberos(nombre?: string) {
  return useQuery<Barbero[], Error>({
    queryKey: ['barberos', nombre],
    queryFn: async () => {
      const all = await fetchBarberos()
      // Si no hay filtro, devolvemos todo
      if (!nombre) return all
      // Filtramos localmente por nombre
      return all.filter((b) =>
        b.nombre.toLowerCase().includes(nombre.toLowerCase())
      )
    },
    staleTime: 1000 * 60 * 5,    // 5 minutos en caché
    refetchOnWindowFocus: true,  // refetch al volver a la pestaña
  })
}
