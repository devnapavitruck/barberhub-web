// src/pages/api/barbero/reservas/[id].ts
import type { NextApiRequest, NextApiResponse } from 'next'
import prisma from '@/lib/prisma' // usamos tu wrapper, no @prisma/client

type Estado = 'PENDING' | 'CONFIRMED' | 'CANCELLED'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'PATCH') return res.status(405).json({ error: 'Sólo PATCH' })

  const id = Number(req.query.id)
  if (!Number.isFinite(id)) return res.status(400).json({ error: 'ID inválido' })

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body
    const estado = (body?.estado as string | undefined)?.toUpperCase() as Estado | undefined

    // La UI sólo envía CONFIRMED o CANCELLED
    if (!estado || !['CONFIRMED', 'CANCELLED'].includes(estado))
      return res.status(400).json({ error: 'Estado inválido' })

    const updated = await prisma.reserva.update({
      where: { id },
      data: { estado },
      select: { id: true, estado: true },
    })

    return res.status(200).json({ ok: true, item: updated })
  } catch (e: any) {
    // Si no existe el registro, Prisma lanza P2025
    if (e?.code === 'P2025') return res.status(404).json({ error: 'Reserva no encontrada' })
    console.error(e)
    return res.status(500).json({ error: 'Error interno' })
  }
}
