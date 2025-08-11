// src/hooks/useBarberoPerfil.ts
import { useQuery } from '@tanstack/react-query'

export interface BarberoPerfil {
  id: number
  nombres: string
  apellidos: string
  telefono: string
  ciudad: string
  avatarUrl?: string
  servicios: { id: number; nombre: string; precio: number }[]
}

export default function useBarberoPerfil() {
  return useQuery<BarberoPerfil, Error>({
    queryKey: ['barbero', 'perfil'],
    queryFn: async () => {
      const token = localStorage.getItem('token')
      console.log('🔑 Enviando token:', token)
      const res = await fetch('/api/barbero/perfil', {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.status === 401) {
        throw new Error('No autorizado – token inválido o faltante')
      }
      if (!res.ok) {
        throw new Error('Error cargando perfil de barbero')
      }
      return res.json()
    },
    staleTime: 5 * 60_000,
  })
}
