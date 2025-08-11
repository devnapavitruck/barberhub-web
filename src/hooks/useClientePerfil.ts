// src/hooks/useClientePerfil.ts

import { useQuery } from '@tanstack/react-query'

export interface ClientePerfil {
  usuarioId: number
  nombres:   string
  apellidos: string
  telefono:  string
  ciudad:    string
}

/**
 * Hook para obtener el perfil del cliente autenticado.
 * Si lo importas como default o como named, funcionará sin errores.
 */
export function useClientePerfil() {
  return useQuery<ClientePerfil, Error>({
    queryKey: ['clientePerfil'],
    queryFn: async () => {
      // Solo corre en cliente (evita SSR)
      if (typeof window === 'undefined') {
        throw new Error('No disponible en SSR')
      }
      const token = localStorage.getItem('token')
      if (!token) {
        throw new Error('Sin token de autenticación')
      }

      const res = await fetch('/api/cliente/perfil', {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (res.status === 401) {
        throw new Error('No autorizado')
      }
      if (!res.ok) {
        throw new Error('Error cargando perfil')
      }

      return (await res.json()) as ClientePerfil
    },
  })
}

// Damos también un default export para evitar problemas de importación
export default useClientePerfil
