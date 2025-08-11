// src/hooks/useFavoritos.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

type FavoritosIds = number[]

export type FavBarbero = {
  id: number
  nombres: string
  apellidos: string
  ciudad: string | null
  nombreBarberia: string | null
}

/** Construye headers SIEMPRE como Record<string,string> (sin undefined) */
function buildHeaders(extra?: Record<string, string>): Record<string, string> {
  const headers: Record<string, string> = { ...(extra || {}) }
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('token')
    if (token) headers.Authorization = `Bearer ${token}`
  }
  return headers
}

async function fetchFavoritosIds(): Promise<FavoritosIds> {
  const res = await fetch('/api/cliente/favoritos', {
    headers: buildHeaders(),
  })
  if (res.status === 401) throw new Error('No autorizado')
  if (!res.ok) throw new Error('No se pudieron cargar los favoritos')
  return res.json()
}

async function fetchFavoritosFull(): Promise<FavBarbero[]> {
  const res = await fetch('/api/cliente/favoritos?full=1', {
    headers: buildHeaders(),
  })
  if (res.status === 401) throw new Error('No autorizado')
  if (!res.ok) throw new Error('No se pudieron cargar los favoritos')
  return res.json()
}

/**
 * Hook para leer IDs y alternar favorito de un barbero concreto.
 * - invalidamos ['favoritos'] e ['favoritos','full'] para refrescar Home.
 */
export function useFavoritos(targetBarberoId?: number) {
  const qc = useQueryClient()

  const { data = [], isFetching } = useQuery({
    queryKey: ['favoritos'],
    queryFn: fetchFavoritosIds,
    staleTime: 60_000,
  })

  const isFavorite =
    typeof targetBarberoId === 'number' ? data.includes(targetBarberoId) : false

  const toggleMutation = useMutation({
    mutationFn: async (barberoId: number) => {
      const res = await fetch('/api/cliente/favoritos', {
        method: 'POST',
        headers: buildHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({ barberoId }),
      })
      if (!res.ok) throw new Error('No se pudo actualizar favoritos')
      return barberoId
    },
    onMutate: async (barberoId) => {
      await qc.cancelQueries({ queryKey: ['favoritos'] })
      await qc.cancelQueries({ queryKey: ['favoritos', 'full'] })

      const prevIds = qc.getQueryData<number[]>(['favoritos']) ?? []
      const nextIds = prevIds.includes(barberoId)
        ? prevIds.filter((id) => id !== barberoId)
        : [...prevIds, barberoId]

      qc.setQueryData(['favoritos'], nextIds)
      return { prevIds }
    },
    onError: (_e, _id, ctx) => {
      if (ctx?.prevIds) qc.setQueryData(['favoritos'], ctx.prevIds)
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ['favoritos'] })
      qc.invalidateQueries({ queryKey: ['favoritos', 'full'] })
    },
  })

  return {
    favoritos: data,
    isFavorite,
    isLoading: isFetching,
    isToggling: toggleMutation.isPending,
    toggleFavorite: (id?: number) => {
      const realId = typeof id === 'number' ? id : targetBarberoId
      if (typeof realId === 'number') toggleMutation.mutate(realId)
    },
  }
}

/** Hook para obtener los favoritos con datos completos (para la sección “Mis Favoritos”). */
export function useFavoritosFull() {
  const { data = [], isFetching } = useQuery({
    queryKey: ['favoritos', 'full'],
    queryFn: fetchFavoritosFull,
    staleTime: 60_000,
  })
  return { favoritos: data, isLoading: isFetching }
}
