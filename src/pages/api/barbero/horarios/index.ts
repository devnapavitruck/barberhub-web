// src/pages/api/barbero/horarios/index.ts
import type { NextApiRequest, NextApiResponse } from 'next'
import prisma from '@/lib/prisma'
import jwt from 'jsonwebtoken'

type Dia = 'Lun' | 'Mar' | 'Mié' | 'Jue' | 'Vie' | 'Sáb' | 'Dom'
type HorarioDTO = {
  dia: Dia
  activo: boolean
  inicio: string | null // "HH:MM"
  fin: string | null    // "HH:MM"
  pausaInicio?: string | null
  pausaFin?: string | null
}

const DIAS: Dia[] = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']

function minutes(hhmm: string) {
  const [h, m] = hhmm.split(':').map((n) => Number(n))
  return (isFinite(h) ? h : 0) * 60 + (isFinite(m) ? m : 0)
}

async function getBarberoIdFromReq(req: NextApiRequest): Promise<number | null> {
  const auth = req.headers.authorization
  const bearer = auth?.startsWith('Bearer ') ? auth.slice(7) : null
  const cookieToken = req.cookies?.['token'] || null
  const token = bearer || cookieToken

  try {
    if (token && process.env.JWT_SECRET) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET) as { userId: number }
      const perfil = await prisma.perfilBarbero.findUnique({
        where: { usuarioId: decoded.userId },
        select: { id: true },
      })
      if (perfil?.id) return perfil.id
    }
  } catch {}

  const qid = Number(req.query.barberoId)
  return Number.isFinite(qid) ? qid : null
}

function normalizeSemana(rows: any[]): HorarioDTO[] {
  const byDia = new Map<string, any>()
  for (const r of rows) byDia.set(r.dia, r)

  return DIAS.map((d): HorarioDTO => {
    const r: any = byDia.get(d)
    if (!r) return { dia: d, activo: false, inicio: null, fin: null, pausaInicio: null, pausaFin: null }
    const inicio = r.inicio ?? null
    const fin = r.fin ?? null
    const activo = Boolean(inicio && fin)
    return { dia: d, activo, inicio, fin, pausaInicio: null, pausaFin: null }
  })
}

function validateSemana(semana: HorarioDTO[]) {
  if (!Array.isArray(semana) || semana.length !== 7) return 'Payload inválido: se esperan 7 días.'
  for (const d of semana) {
    if (!DIAS.includes(d.dia)) return `Día inválido: ${d.dia}`
    if (!d.activo) continue
    if (!d.inicio || !d.fin) return `Faltan horas en ${d.dia}`
    if (minutes(d.inicio) >= minutes(d.fin)) return `inicio < fin requerido en ${d.dia}`
  }
  return null
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const barberoId = await getBarberoIdFromReq(req)
  if (!barberoId) return res.status(401).json({ error: 'No autenticado (o falta barberoId).' })

  if (req.method === 'GET') {
    try {
      const rows = await prisma.horario.findMany({
        where: { barberoId },
        select: { id: true, dia: true, inicio: true, fin: true },
        orderBy: { id: 'asc' },
      })
      const semana = normalizeSemana(rows as any[])
      return res.status(200).json({ items: semana })
    } catch (e: any) {
      console.error(e)
      return res.status(500).json({ error: 'Error interno' })
    }
  }

  if (req.method === 'PATCH') {
    try {
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body
      const semana: HorarioDTO[] = body?.items || body
      const err = validateSemana(semana)
      if (err) return res.status(400).json({ error: err })

      for (const d of semana) {
        const existing = await prisma.horario.findFirst({
          where: { barberoId, dia: d.dia },
          select: { id: true },
        })

        // Si el día está inactivo → borrar registro si existe (porque inicio/fin son NOT NULL en tu schema)
        if (!d.activo || !d.inicio || !d.fin) {
          if (existing) {
            await prisma.horario.delete({ where: { id: existing.id } })
          }
          continue
        }

        // Día activo → upsert con strings (no null)
        const data = {
          barberoId,
          dia: d.dia,
          inicio: d.inicio as string,
          fin: d.fin as string,
        }

        if (existing) {
          await prisma.horario.update({ where: { id: existing.id }, data })
        } else {
          await prisma.horario.create({ data })
        }
      }

      return res.status(200).json({ ok: true })
    } catch (e: any) {
      console.error(e)
      return res.status(500).json({ error: 'Error interno' })
    }
  }

  return res.status(405).json({ error: 'Sólo GET y PATCH' })
}
