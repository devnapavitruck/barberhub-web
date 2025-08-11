import type { NextApiRequest, NextApiResponse } from 'next'
import prisma from '@/lib/prisma'
import jwt from 'jsonwebtoken'

// Helpers de fecha
const startOfDay = (d: Date) => {
  const x = new Date(d); x.setHours(0, 0, 0, 0); return x
}
const endOfDay = (d: Date) => {
  const x = new Date(d); x.setHours(23, 59, 59, 999); return x
}

// Lee userId (barbero) desde Authorization: Bearer <token>
function getUserId(req: NextApiRequest): number | null {
  const auth = req.headers.authorization
  if (!auth?.startsWith('Bearer ') || !process.env.JWT_SECRET) return null
  try {
    const token = auth.slice(7)
    const dec = jwt.verify(token, process.env.JWT_SECRET) as { userId: number }
    return dec?.userId ?? null
  } catch {
    return null
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Sólo GET' })

  const barberoUsuarioId = getUserId(req)
  if (!barberoUsuarioId) return res.status(401).json({ error: 'No autorizado' })

  try {
    const today = new Date()
    const reservas = await prisma.reserva.findMany({
      where: {
        barberoId: barberoUsuarioId,
        fecha: { gte: startOfDay(today), lte: endOfDay(today) },
      },
      orderBy: [{ fecha: 'asc' }, { hora: 'asc' }],
      include: {
        cliente: {
          select: {
            clientePerfil: { select: { nombres: true, apellidos: true } },
          },
        },
        servicio: { select: { nombre: true } },
      },
    })

    const items = reservas.map(r => {
      const nombres = r.cliente.clientePerfil?.nombres ?? ''
      const apellidos = r.cliente.clientePerfil?.apellidos ?? ''
      const clienteNombre = `${nombres} ${apellidos}`.trim() || 'Cliente'
      return {
        id: r.id,
        clienteNombre,
        hora: r.hora,
        servicioNombre: r.servicio?.nombre ?? 'Servicio',
        estado: r.estado as 'PENDING' | 'CONFIRMED' | 'CANCELLED',
      }
    })

    return res.status(200).json(items)
  } catch (e) {
    console.error('Error reservas hoy:', e)
    return res.status(500).json({ error: 'Error interno' })
  }
}
