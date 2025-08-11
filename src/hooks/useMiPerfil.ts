// src/hooks/useMiPerfil.ts
import { useQuery } from '@tanstack/react-query'

export interface PerfilResponse {
  role: 'CLIENTE' | 'BARBERO'
  perfil: Record<string, any>
}

export function useMiPerfil() {
  return useQuery<PerfilResponse, Error>({
    queryKey: ['miPerfil'],
    queryFn: async () => {
      const token = localStorage.getItem('token') ?? ''
      const res = await fetch('/api/me/perfil', {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) throw new Error('Error al cargar perfil')
      return (await res.json()) as PerfilResponse
    },
    // Si quieres puedes controlar el cache con staleTime:
    // staleTime: 1000 * 60, // 1 minuto
  })
}
