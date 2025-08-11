// src/pages/api/cliente/favoritos.ts
import type { NextApiRequest, NextApiResponse } from 'next'
import prisma from '@/lib/prisma'
import { getSession } from '@/lib/auth'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getSession({ req })
  if (!session) return res.status(401).json({ error: 'No autorizado' })

  const clienteId = session.user.id

  // ========== GET ==========
  if (req.method === 'GET') {
    const full = String(req.query.full || '') === '1'
    try {
      // En DB favorito.barberoId es el USUARIO del barbero
      const favs = await prisma.favorito.findMany({
        where: { clienteId },
        select: { barberoId: true },
      })

      // Mapear usuarioId -> perfilBarbero
      const perfiles = await prisma.perfilBarbero.findMany({
        where: { usuarioId: { in: favs.map(f => f.barberoId) } },
        select: { id: true, usuarioId: true, nombres: true, apellidos: true, ciudad: true, nombreBarberia: true },
      })

      if (!full) {
        // Devolver SOLO ids de PERFIL (para que coincida con /barbero/[id])
        const idsPerfil = favs
          .map(f => perfiles.find(p => p.usuarioId === f.barberoId)?.id)
          .filter((x): x is number => Boolean(x))
        return res.status(200).json(idsPerfil)
      }

      // Devolver tarjetas completas para “Mis Favoritos”
      const data = perfiles.map(p => ({
        id: p.id, // id de PerfilBarbero
        nombres: p.nombres,
        apellidos: p.apellidos,
        ciudad: p.ciudad,
        nombreBarberia: p.nombreBarberia,
      }))
      return res.status(200).json(data)
    } catch (e) {
      console.error('GET /favoritos error:', e)
      return res.status(500).json({ error: 'No se pudieron cargar los favoritos' })
    }
  }

  // ========== POST (toggle) ==========
  if (req.method === 'POST') {
    try {
      const { barberoId } = req.body as { barberoId?: number }
      if (!barberoId || Number.isNaN(barberoId)) {
        return res.status(400).json({ error: 'barberoId inválido' })
      }

      // El front manda id de PERFIL → convertir a USUARIO para guardar en favorito
      const perfil = await prisma.perfilBarbero.findUnique({
        where: { id: barberoId },
        select: { usuarioId: true },
      })
      const barberoUsuarioId = perfil?.usuarioId ?? null
      if (!barberoUsuarioId) {
        return res.status(400).json({ error: 'Barbero inválido' })
      }

      const existe = await prisma.favorito.findFirst({
        where: { clienteId, barberoId: barberoUsuarioId },
        select: { id: true },
      })

      if (existe) {
        await prisma.favorito.delete({ where: { id: existe.id } })
      } else {
        await prisma.favorito.create({
          data: { clienteId, barberoId: barberoUsuarioId },
        })
      }

      // 204 sin cuerpo: el hook invalidará las queries y refrescará
      return res.status(204).end()
    } catch (e) {
      console.error('POST /favoritos error:', e)
      return res.status(500).json({ error: 'No se pudo actualizar favoritos' })
    }
  }

  res.setHeader('Allow', ['GET', 'POST'])
  return res.status(405).json({ error: `Method ${req.method} Not Allowed` })
}
