// src/pages/api/cliente/reservas.ts
import type { NextApiRequest, NextApiResponse } from 'next'
import prisma from '@/lib/prisma'
import nodemailer from 'nodemailer'
import { reservationTemplate } from '@/utils/emailTemplates'
import jwt from 'jsonwebtoken'

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST!,
  port: Number(process.env.EMAIL_PORT!) || 587,
  secure: process.env.EMAIL_PORT === '465',
  auth: { user: process.env.EMAIL_USER!, pass: process.env.EMAIL_PASS! },
})

function getClienteId(req: NextApiRequest): number | null {
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

// YYYY-MM-DD -> Date anclada al MEDIODÍA UTC (como ya veníamos guardando)
function parseYmdToUTCNoon(ymd: string) {
  const [y, m, d] = ymd.split('-').map(Number)
  return new Date(Date.UTC(y, (m || 1) - 1, d || 1, 12, 0, 0, 0))
}

// Versión local para comparar “pasado”
function parseYMDLocal(ymd: string) {
  const [y, m, d] = ymd.split('-').map(Number)
  return new Date(y, (m || 1) - 1, d || 1, 0, 0, 0, 0)
}

const DIAS_UTC = ['Dom','Lun','Mar','Mié','Jue','Vie','Sáb'] as const
const toMinutes = (hhmm: string) => { const [h, m] = hhmm.split(':').map(Number); return (h||0)*60 + (m||0) }
const overlap = (a1:number,a2:number,b1:number,b2:number) => Math.max(a1,b1) < Math.min(a2,b2)

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const clienteId = getClienteId(req)
  if (!clienteId) return res.status(401).json({ error: 'No autorizado' })

  // ============== GET ==============
  if (req.method === 'GET') {
    const { status, limit } = req.query as { status?: string; limit?: string }
    try {
      const where: any = { clienteId }
      if (status) where.estado = status.toUpperCase()
      const take = limit ? parseInt(limit, 10) : undefined

      const reservas = await prisma.reserva.findMany({
        where, take,
        orderBy: { fecha: 'asc' },
        include: {
          barbero: {
            select: {
              id: true,
              email: true,
              barberoPerfil: { select: { nombres: true, apellidos: true, ciudad: true, nombreBarberia: true } },
            },
          },
          servicio: { select: { nombre: true, precio: true, duracion: true } },
        },
      })
      return res.status(200).json(reservas)
    } catch (err) {
      console.error('Error listando reservas:', err)
      return res.status(500).json({ error: 'No se pudo obtener las reservas' })
    }
  }

  // ============== POST ==============
  if (req.method === 'POST') {
    const { barberoId, servicioId, fecha, hora, notas } = req.body as {
      barberoId: number            // ID del PERFIL del barbero
      servicioId: number
      fecha: string                // "YYYY-MM-DD"
      hora: string                 // "HH:MM"
      notas?: string
    }
    if (!barberoId || !servicioId || !fecha || !hora) {
      return res.status(400).json({ error: 'Faltan datos obligatorios' })
    }

    try {
      // 0) Bloquear reservas en el pasado (comparación LOCAL)
      const localTarget = parseYMDLocal(fecha)
      const [hh, mm] = hora.split(':').map(Number)
      localTarget.setHours(hh || 0, mm || 0, 0, 0)
      if (localTarget.getTime() <= Date.now()) {
        return res.status(409).json({ error: 'No puedes reservar en el pasado' })
      }

      // 1) perfil -> usuario del barbero
      const perfil = await prisma.perfilBarbero.findUnique({
        where: { id: barberoId },
        select: { id: true, usuarioId: true, nombres: true, apellidos: true, ciudad: true },
      })
      if (!perfil) return res.status(400).json({ error: 'Barbero inválido' })
      const barberoUsuarioId = perfil.usuarioId

      // 2) servicio
      const svc = await prisma.servicio.findUnique({
        where: { id: servicioId },
        select: { id: true, nombre: true, duracion: true, precio: true, barberoId: true },
      })
      if (!svc) return res.status(400).json({ error: 'Servicio inválido' })
      if (svc.barberoId !== perfil.id) {
        return res.status(400).json({ error: 'Servicio no pertenece al barbero' })
      }

      // 3) validar horario del día (en UTC)
      const fechaUTCNoon = parseYmdToUTCNoon(fecha)
      const dow = DIAS_UTC[fechaUTCNoon.getUTCDay()]
      const horario = await prisma.horario.findFirst({
        where: { barberoId: perfil.id, dia: dow },
        select: { inicio: true, fin: true },
      })
      if (!horario?.inicio || !horario?.fin) {
        return res.status(409).json({ error: 'El barbero no atiende ese día' })
      }
      const start = toMinutes(hora)
      const end   = start + (svc.duracion || 30)
      const toMin = (hhmm: string) => { const [h, m] = hhmm.split(':').map(Number); return (h||0)*60 + (m||0) }
      if (start < toMin(horario.inicio) || end > toMin(horario.fin)) {
        return res.status(409).json({ error: 'Hora fuera del horario de atención' })
      }

      // 4) solapes con reservas del barbero (PENDING/CONFIRMED) ese mismo día (UTC)
      const { start: dayStart, end: dayEnd } = (() => {
        const y = fechaUTCNoon.getUTCFullYear()
        const m = fechaUTCNoon.getUTCMonth()
        const d = fechaUTCNoon.getUTCDate()
        return {
          start: new Date(Date.UTC(y, m, d, 0, 0, 0, 0)),
          end:   new Date(Date.UTC(y, m, d, 23, 59, 59, 999)),
        }
      })()

      const mismasFecha = await prisma.reserva.findMany({
        where: {
          barberoId: barberoUsuarioId,
          fecha: { gte: dayStart, lte: dayEnd },
          estado: { in: ['PENDING', 'CONFIRMED'] },
        },
        select: { hora: true, servicio: { select: { duracion: true } } },
        orderBy: { fecha: 'asc' },
      })
      for (const r of mismasFecha) {
        const rs = toMinutes(r.hora)
        const re = rs + (r.servicio?.duracion || 30)
        if (overlap(start, end, rs, re)) {
          return res.status(409).json({ error: 'Ese bloque ya está ocupado' })
        }
      }

      // 5) crear PENDING
      const reserva = await prisma.reserva.create({
        data: {
          clienteId,
          barberoId: barberoUsuarioId,
          servicioId,
          fecha: fechaUTCNoon,
          hora,
          notas: notas ?? null,
          estado: 'PENDING',
          motivoCancel: null,
          completadaAt: null,
        },
        include: {
          cliente: {
            select: {
              email: true,
              clientePerfil: { select: { nombres: true, apellidos: true, region: true, comuna: true, ciudad: true } },
            },
          },
          barbero: {
            select: {
              email: true,
              barberoPerfil: { select: { nombres: true, apellidos: true, nombreBarberia: true, ciudad: true } },
            },
          },
          servicio: { select: { nombre: true, precio: true, duracion: true } },
        },
      })

      // 6) email al barbero (best-effort)
      try {
        const perfilCliente = reserva.cliente.clientePerfil!
        const barberia = reserva.barbero.barberoPerfil?.nombreBarberia || 'Tu barbero'
        const html = reservationTemplate({
          nombre: `${perfilCliente.nombres} ${perfilCliente.apellidos}`,
          barbero: barberia,
          servicio: reserva.servicio.nombre,
          fechaFormateada: reserva.fecha.toLocaleDateString('es-CL', {
            weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC',
          }),
          hora: reserva.hora,
          direccion: `${perfilCliente.region || ''} ${perfilCliente.comuna || ''} ${perfilCliente.ciudad || ''}`.trim(),
        })
        await transporter.sendMail({
          from: `"BarberHub" <${process.env.EMAIL_FROM}>`,
          to: reserva.barbero.email,
          subject: 'Nueva reserva pendiente',
          html,
        })
      } catch (e) {
        console.warn('Email skip (dev):', (e as any)?.message || e)
      }

      return res.status(201).json(reserva)
    } catch (err) {
      console.error('Error creando reserva:', err)
      return res.status(500).json({ error: 'No se pudo crear la reserva' })
    }
  }

  res.setHeader('Allow', ['GET', 'POST'])
  return res.status(405).json({ error: `Method ${req.method} Not Allowed` })
}
