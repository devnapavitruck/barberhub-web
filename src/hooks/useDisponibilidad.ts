// src/hooks/useDisponibilidad.ts

import { useQuery } from '@tanstack/react-query';

export function useDisponibilidad(barberoId: number, fecha: string) {
  return useQuery<string[], Error>({
    queryKey: ['disponibilidad', barberoId, fecha],
    queryFn: async () => {
      const res = await fetch(
        `/api/barbero/${barberoId}/disponibilidad?fecha=${fecha}`
      );
      if (!res.ok) {
        throw new Error('Error cargando disponibilidad');
      }
      return res.json();
    },
    enabled: Boolean(fecha),
  });
}

// ----------------------------------------------
// Añade este default export:
export default useDisponibilidad
