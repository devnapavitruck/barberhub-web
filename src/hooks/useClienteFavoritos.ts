// src/hooks/useClienteFavoritos.ts

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

/**
 * Hook para consultar la lista de barberoId favoritos del cliente.
 * GET /api/cliente/favoritos → number[]
 */
export function useClienteFavoritosQuery() {
  return useQuery<number[], Error>({
    queryKey: ['favoritos'],
    queryFn: () =>
      fetch('/api/cliente/favoritos').then((r) => {
        if (!r.ok) throw new Error('Error al cargar favoritos')
        return r.json() as Promise<number[]>
      }),
  })
}

/**
 * Hook para hacer toggle (añadir/quitar) un favorito de forma optimista.
 * POST /api/cliente/favoritos { barberoId }
 */
export function useClienteFavoritos() {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: (barberoId: number) =>
      fetch('/api/cliente/favoritos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ barberoId }),
      }).then((r) => {
        if (!r.ok) throw new Error('Error al actualizar favorito')
      }),

    // Optimistic update: actualiza la caché antes de la respuesta
    onMutate: async (barberoId) => {
      await qc.cancelQueries({ queryKey: ['favoritos'] })
      const antes = qc.getQueryData<number[]>(['favoritos']) ?? []

      qc.setQueryData<number[]>(['favoritos'], (old = []) =>
        old.includes(barberoId)
          ? old.filter((id) => id !== barberoId)
          : [...old, barberoId]
      )

      return { antes }
    },

    // En caso de error, revertir al estado anterior
    onError: (_, __, contexto: any) => {
      if (contexto?.antes) {
        qc.setQueryData(['favoritos'], contexto.antes)
      }
    },

    // Siempre invalidar la query para volver a sincronizar con el servidor
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ['favoritos'] })
    },
  })
}
