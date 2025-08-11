// src/pages/api/cliente/disponibilidad.ts
import type { NextApiRequest, NextApiResponse } from 'next'
import prisma from '@/lib/prisma'

type Dia = 'Lun' | 'Mar' | 'Mié' | 'Jue' | 'Vie' | 'Sáb' | 'Dom'
const IDX_TO_DIA: Dia[] = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']

// ——— helpers de fecha/hora ———
function parseYMDLocal(ymd: string) {
  // "YYYY-MM-DD" → Date local (00:00) sin UTC
  const [y, m, d] = ymd.split('-').map(Number)
  return new Date(y, (m || 1) - 1, d || 1, 0, 0, 0, 0)
}
function toYMDLocal(d: Date) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const da = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${da}`
}
const startOfDay = (d: Date) => {
  const x = new Date(d); x.setHours(0, 0, 0, 0); return x
}
const endOfDay = (d: Date) => {
  const x = new Date(d); x.setHours(23, 59, 59, 999); return x
}
const toMinutes = (hhmm: string) => {
  const [h, m] = hhmm.split(':').map(Number)
  return (h || 0) * 60 + (m || 0)
}
const fromMinutes = (mins: number) => {
  const h = String(Math.floor(mins / 60)).padStart(2, '0')
  const m = String(mins % 60).padStart(2, '0')
  return `${h}:${m}`
}

// ——— endpoint ———
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Sólo GET' })

  try {
    const barberoId = Number(req.query.barberoId)
    const servicioId = Number(req.query.servicioId)
    const fechaStr = String(req.query.fecha || '') // YYYY-MM-DD

    if (!Number.isFinite(barberoId) || barberoId <= 0)
      return res.status(400).json({ error: 'barberoId inválido' })
    if (!Number.isFinite(servicioId) || servicioId <= 0)
      return res.status(400).json({ error: 'servicioId inválido' })
    if (!/^\d{4}-\d{2}-\d{2}$/.test(fechaStr))
      return res.status(400).json({ error: 'fecha debe ser YYYY-MM-DD' })

    // Fecha target (LOCAL, sin UTC)
    const targetDate = parseYMDLocal(fechaStr)
    if (isNaN(targetDate.getTime()))
      return res.status(400).json({ error: 'fecha inválida' })

    // Servicio (duración y pertenencia)
    const servicio = await prisma.servicio.findUnique({
      where: { id: servicioId },
      select: { id: true, duracion: true, barberoId: true },
    })
    if (!servicio) return res.status(404).json({ error: 'Servicio no existe' })
    if (servicio.barberoId !== barberoId)
      return res.status(400).json({ error: 'Servicio no corresponde al barbero' })

    const duracion = servicio.duracion // en minutos (30/60/90)

    // Horario del día
    const dia: Dia = IDX_TO_DIA[targetDate.getDay()]
    const horario = await prisma.horario.findFirst({
      where: { barberoId, dia },
      select: { inicio: true, fin: true, pausaInicio: true, pausaFin: true } as any,
    })
    if (!horario || !horario.inicio || !horario.fin) {
      return res.status(200).json({ slots: [], stepMin: 30, duracion })
    }

    const hInicio = toMinutes(horario.inicio)
    const hFin = toMinutes(horario.fin)
    if (!(hInicio < hFin)) {
      return res.status(200).json({ slots: [], stepMin: 30, duracion })
    }

    // Pausa (si existe)
    const hasPausa = Boolean(horario.pausaInicio && horario.pausaFin)
    const p1 = hasPausa ? toMinutes(horario.pausaInicio as string) : null
    const p2 = hasPausa ? toMinutes(horario.pausaFin as string) : null

    // Reservas del día (PENDING o CONFIRMED) del barbero
    const dayStart = startOfDay(targetDate)
    const dayEnd = endOfDay(targetDate)
    const reservas = await prisma.reserva.findMany({
      where: {
        barberoId,
        fecha: { gte: dayStart, lte: dayEnd },
        estado: { in: ['PENDING', 'CONFIRMED'] },
      },
      select: {
        fecha: true,
        hora: true,
        servicio: { select: { duracion: true } },
      },
      orderBy: { fecha: 'asc' },
    })

    // Intervalos ocupados [start, end) en minutos desde 00:00 del día
    const busy: Array<[number, number]> = reservas.map((r) => {
      const startMins = r.hora ? toMinutes(r.hora) : (r.fecha.getHours() * 60 + r.fecha.getMinutes())
      const dur = r.servicio?.duracion ?? duracion
      return [startMins, startMins + dur]
    })

    // Generar slots cada 30' y que quepa la duración completa
    const STEP = 30
    const now = new Date()
    const isToday = fechaStr === toYMDLocal(now)

    const candidates: string[] = []
    for (let s = hInicio; s + duracion <= hFin; s += STEP) {
      // respetar pausa
      if (hasPausa && p1 !== null && p2 !== null) {
        const slotEnd = s + duracion
        // descarta si el bloque toca la pausa
        if (!(slotEnd <= p1 || s >= p2)) continue
      }

      // si es hoy, descartar pasados
      if (isToday) {
        const slotDate = new Date(targetDate.getTime())
        slotDate.setHours(Math.floor(s / 60), s % 60, 0, 0)
        if (slotDate.getTime() <= now.getTime()) continue
      }

      // solapes con reservas
      const slotStart = s
      const slotEnd = s + duracion
      const overlap = busy.some(([bStart, bEnd]) => !(slotEnd <= bStart || slotStart >= bEnd))
      if (overlap) continue

      candidates.push(fromMinutes(s))
    }

    return res.status(200).json({
      slots: candidates,
      stepMin: STEP,
      duracion,
    })
  } catch (e: any) {
    console.error(e)
    return res.status(500).json({ error: 'Error interno' })
  }
}
