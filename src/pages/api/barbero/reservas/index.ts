import type { NextApiRequest, NextApiResponse } from 'next'
import prisma from '@/lib/prisma'
import jwt from 'jsonwebtoken'

type Estado = 'PENDING' | 'CONFIRMED' | 'CANCELLED'
type Range = 'hoy' | 'semana' | 'mes' | 'todo'

function getUserId(req: NextApiRequest): number | null {
  try {
    const auth = req.headers.authorization
    const bearer = auth?.startsWith('Bearer ') ? auth.slice(7) : null
    if (bearer && process.env.JWT_SECRET) {
      const dec = jwt.verify(bearer, process.env.JWT_SECRET) as { userId: number }
      return dec?.userId ?? null
    }
  } catch {}
  const token = req.cookies?.['token']
  if (token && process.env.JWT_SECRET) {
    try {
      const dec = jwt.verify(token, process.env.JWT_SECRET) as { userId: number }
      return dec?.userId ?? null
    } catch {}
  }
  return null
}

// límites UTC para un día LOCAL (00:00–23:59)
function dayBoundsUTC(localDate: Date) {
  const y = localDate.getFullYear()
  const m = localDate.getMonth()
  const d = localDate.getDate()
  const start = new Date(Date.UTC(y, m, d, 0, 0, 0, 0))
  const end = new Date(Date.UTC(y, m, d, 23, 59, 59, 999))
  return { start, end }
}

function weekBoundsUTC(localDate: Date) {
  const tmp = new Date(localDate)
  // Lunes como inicio de semana
  const day = (tmp.getDay() + 6) % 7 // 0=lun … 6=dom
  tmp.setDate(tmp.getDate() - day)
  const { start } = dayBoundsUTC(tmp)
  const endTmp = new Date(tmp)
  endTmp.setDate(tmp.getDate() + 6)
  const { end } = dayBoundsUTC(endTmp)
  return { start, end }
}

function monthBoundsUTC(localDate: Date) {
  const y = localDate.getFullYear()
  const m = localDate.getMonth()
  const { start } = dayBoundsUTC(new Date(y, m, 1))
  const lastDay = new Date(y, m + 1, 0)
  const { end } = dayBoundsUTC(lastDay)
  return { start, end }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Sólo GET' })

  try {
    // barberoUserId: del token o del query
    const tokenId = getUserId(req)
    const barberoUserId = Number(req.query.barberoUserId || tokenId)
    if (!Number.isFinite(barberoUserId) || barberoUserId <= 0) {
      return res.status(401).json({ error: 'No autorizado' })
    }

    // estado/status opcional
    const raw = (req.query.estado ?? req.query.status) as string | undefined
    const estado = raw ? (raw.toUpperCase() as Estado) : undefined
    const valid = new Set<Estado>(['PENDING', 'CONFIRMED', 'CANCELLED'])
    if (estado && !valid.has(estado)) {
      return res.status(400).json({ error: 'Estado inválido' })
    }

    // rango de fechas: hoy | semana | mes | todo
    const range = (String(req.query.range || 'todo').toLowerCase() as Range)
    const now = new Date()
    let fechaFilter: any = undefined
    if (range === 'hoy') {
      const { start, end } = dayBoundsUTC(now)
      fechaFilter = { gte: start, lte: end }
    } else if (range === 'semana') {
      const { start, end } = weekBoundsUTC(now)
      fechaFilter = { gte: start, lte: end }
    } else if (range === 'mes') {
      const { start, end } = monthBoundsUTC(now)
      fechaFilter = { gte: start, lte: end }
    }

    const where: any = { barberoId: barberoUserId }
    if (estado) where.estado = estado
    if (fechaFilter) where.fecha = fechaFilter

    const reservas = await prisma.reserva.findMany({
      where,
      orderBy: [{ fecha: 'asc' }, { hora: 'asc' }],
      include: {
        servicio: { select: { id: true, nombre: true, duracion: true, precio: true } },
        cliente: {
          select: { id: true, clientePerfil: { select: { nombres: true, apellidos: true } } },
        },
      },
    })

    const items = reservas.map((r) => {
      const fechaISO =
        r.fecha instanceof Date ? r.fecha.toISOString() : (r as any).fecha ?? ''
      const fechaYMD = fechaISO ? fechaISO.slice(0, 10) : ''
      return {
        id: r.id,
        estado: r.estado as Estado,
        // ⬇️ compatibilidad con la UI actual
        fecha: fechaISO,         // <- ESTE es el que usa la UI para .slice(0,10)
        fechaISO,
        fechaYMD,
        hora: r.hora ?? '',
        completadaAt: r.completadaAt ?? null,
        servicio: r.servicio
          ? {
              id: r.servicio.id,
              nombre: r.servicio.nombre,
              duracion: r.servicio.duracion,
              precio: r.servicio.precio,
            }
          : null,
        cliente: {
          id: r.cliente?.id ?? null,
          nombres: r.cliente?.clientePerfil?.nombres ?? '',
          apellidos: r.cliente?.clientePerfil?.apellidos ?? '',
        },
      }
    })

    return res.status(200).json({ items })
  } catch (e) {
    console.error('barbero/reservas error:', e)
    return res.status(500).json({ error: 'Error interno' })
  }
}
