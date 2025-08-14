// src/pages/api/barbero/reservas/index.ts
import type { NextApiRequest, NextApiResponse } from 'next'
import prisma from '@/lib/prisma'

type Estado = 'PENDING' | 'CONFIRMED' | 'CANCELLED'

// Helpers de fechas (modo local)
const startOfDayLocal = (d: Date) => { const x = new Date(d); x.setHours(0, 0, 0, 0); return x }
const nextDayLocal = (d: Date) => { const x = new Date(d); x.setDate(x.getDate() + 1); x.setHours(0, 0, 0, 0); return x }
const parseYMDLocalNoon = (s?: string | null) => {
  if (!s) return null
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s)
  if (!m) return null
  return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]), 12, 0, 0, 0) // 12:00 local
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Sólo GET' })

  try {
    // --- Identificación del barbero ---
    // Preferimos barberoUserId (ID de Usuario). Si no llega, aceptamos barberoId/perfilId y lo resolvemos a usuarioId.
    let barberoUserId: number | null =
      req.query.barberoUserId ? Number(req.query.barberoUserId) : null

    if (!barberoUserId) {
      const perfilIdRaw = (req.query.barberoId ?? req.query.perfilId) as string | undefined
      const perfilId = perfilIdRaw ? Number(perfilIdRaw) : NaN
      if (Number.isFinite(perfilId) && perfilId > 0) {
        const perfil = await prisma.perfilBarbero.findUnique({
          where: { id: perfilId },
          select: { usuarioId: true },
        })
        barberoUserId = perfil?.usuarioId ?? null
      }
    }
    if (!barberoUserId) {
      return res.status(400).json({ error: 'Falta barberoUserId o barberoId/perfilId' })
    }

    // --- Filtro por estado ---
    const rawEstado = (req.query.estado ?? req.query.status) as string | undefined
    const valid = new Set<Estado>(['PENDING', 'CONFIRMED', 'CANCELLED'])
    let estadoFilter: { in: Estado[] } | Estado | undefined = { in: ['PENDING', 'CONFIRMED'] }
    if (rawEstado) {
      const up = rawEstado.toUpperCase() as Estado
      if (!valid.has(up)) return res.status(400).json({ error: 'Estado inválido' })
      estadoFilter = up
    }

    // --- Rango de fechas (día o intervalo) ---
    // Soporta: ?from=YYYY-MM-DD&to=YYYY-MM-DD
    // Si no llega, por defecto "HOY" (vista día).
    const fromParam = parseYMDLocalNoon(String(req.query.from || ''))
    const toParam = parseYMDLocalNoon(String(req.query.to || ''))
    const today = new Date()
    const from = fromParam ? startOfDayLocal(fromParam) : startOfDayLocal(today)
    const to = toParam ? nextDayLocal(toParam) : nextDayLocal(today)

    // --- Query ---
    const where: any = {
      barberoId: barberoUserId,
      fecha: { gte: from, lt: to }, // rango [inicio del día, inicio del día siguiente)
    }
    if (estadoFilter) where.estado = estadoFilter

    const reservas = await prisma.reserva.findMany({
      where,
      orderBy: [{ fecha: 'asc' }, { hora: 'asc' }],
      select: {
        id: true,
        fecha: true,
        hora: true,
        estado: true,
        completadaAt: true,
        servicio: { select: { id: true, nombre: true, duracion: true, precio: true } },
        cliente: {
          select: { id: true, clientePerfil: { select: { nombres: true, apellidos: true } } },
        },
      },
    })

    // --- Shape de respuesta (conservando compatibilidad de tu UI) ---
    const items = reservas.map((r) => ({
      id: r.id,
      estado: r.estado as Estado,
      fecha: r.fecha instanceof Date ? r.fecha.toISOString() : (r.fecha as any),
      // Devolvemos la "hora" tal cual está guardada (HH:mm). Evitamos toLocale* para no desfasar.
      hora: typeof r.hora === 'string' ? r.hora : '',
      completadaAt: r.completadaAt ?? null,
      servicio: {
        id: r.servicio.id,
        nombre: r.servicio.nombre,
        duracion: r.servicio.duracion,
        precio: r.servicio.precio,
      },
      cliente: {
        id: r.cliente?.id ?? null,
        nombres: r.cliente?.clientePerfil?.nombres ?? '',
        apellidos: r.cliente?.clientePerfil?.apellidos ?? '',
      },
    }))

    return res.status(200).json({ items })
  } catch (e) {
    console.error('[barbero/reservas] error', e)
    return res.status(500).json({ error: 'Error interno' })
  }
}
