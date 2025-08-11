// src/hooks/useServiciosBarbero.ts
import { useQuery } from '@tanstack/react-query'

export interface Servicio {
  id: number
  nombre: string
  precio: number
  duracion: number
}

export function useServiciosBarbero(barberoId: number) {
  return useQuery<Servicio[], Error>({
    queryKey: ['serviciosBarbero', barberoId],
    queryFn: async () => {
      const res = await fetch(`/api/barbero/${barberoId}/servicios`)
      if (!res.ok) throw new Error('Error cargando servicios')
      return res.json()
    },
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: true,
  })
}

// **Añade este default export** para que sea invocable sin error:
export default useServiciosBarbero
