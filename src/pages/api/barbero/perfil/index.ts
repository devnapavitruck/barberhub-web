// src/pages/api/barbero/perfil/index.ts

import type { NextApiRequest, NextApiResponse } from 'next'
import jwt from 'jsonwebtoken'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export const config = {
  api: { bodyParser: true },
}

type JwtPayload = { userId: number; rol: 'CLIENTE' | 'BARBERO' }

// Helpers
function parseDate(value: string | Date | undefined): Date {
  try {
    if (!value) return new Date()
    const d = new Date(value)
    return isNaN(d.getTime()) ? new Date() : d
  } catch {
    return new Date()
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET' && req.method !== 'PATCH') {
    res.setHeader('Allow', ['GET', 'PATCH'])
    return res.status(405).end(`Method ${req.method} Not Allowed`)
  }

  // --- Auth
  const auth = req.headers.authorization || ''
  const token = auth.replace(/^Bearer\s+/, '')
  if (!token) return res.status(401).json({ error: 'No autorizado' })

  let payload: JwtPayload
  try {
    payload = jwt.verify(token, process.env.JWT_SECRET as string) as JwtPayload
  } catch {
    return res.status(401).json({ error: 'Token inválido' })
  }
  if (payload.rol !== 'BARBERO') {
    return res.status(403).json({ error: 'Rol inválido' })
  }
  const userId = payload.userId

  if (req.method === 'GET') {
    try {
      const p = await prisma.perfilBarbero.findUnique({
        where: { usuarioId: userId },
        select: {
          id: true,
          usuarioId: true,
          avatarUrl: true,
          nombres: true,
          apellidos: true,
          telefono: true,
          nacimiento: true,
          nombreBarberia: true,
          descripcion: true,
          experiencia: true,
          region: true,
          comuna: true,
          ciudad: true,
          direccion: true,
          especialidades: true,
          idiomas: true,
          servicios: { select: { id: true, nombre: true, precio: true } },
          horarios: {
            select: { id: true, dia: true, inicio: true, fin: true, pausaInicio: true, pausaFin: true },
            orderBy: { id: 'asc' },
          },
        },
      })

      if (!p) {
        return res.status(200).json({
          id: null,              // aún no existe PerfilBarbero
          usuarioId: userId,
          avatarUrl: '',
          nombres: '',
          apellidos: '',
          telefono: '',
          nacimiento: new Date().toISOString(),
          nombreBarberia: '',
          descripcion: '',
          experiencia: 0,
          region: '',
          comuna: '',
          ciudad: '',
          direccion: '',
          especialidades: '',
          idiomas: '',
          servicios: [],
          horarios: [],
        })
      }

      return res.status(200).json({
        id: p.id,
        usuarioId: p.usuarioId,
        avatarUrl: p.avatarUrl ?? '',
        nombres: p.nombres,
        apellidos: p.apellidos,
        telefono: p.telefono,
        nacimiento: p.nacimiento.toISOString(),
        nombreBarberia: p.nombreBarberia ?? '',
        descripcion: p.descripcion,
        experiencia: p.experiencia,
        region: p.region,
        comuna: p.comuna,
        ciudad: p.ciudad,
        direccion: p.direccion,
        especialidades: p.especialidades,
        idiomas: p.idiomas,
        servicios: p.servicios,
        horarios: p.horarios,
      })
    } catch (e) {
      console.error('GET /barbero/perfil error:', e)
      return res.status(500).json({ error: 'Error interno' })
    }
  }

  if (req.method === 'PATCH') {
    try {
      const {
        // perfil
        nombres = '',
        apellidos = '',
        telefono = '',
        nacimiento = '',
        region = '',
        comuna = '',
        ciudad = '',
        direccion = '',
        avatarUrl = '',
        nombreBarberia = '',
        descripcion = '',
        experiencia = 0,
        especialidades = '',
        idiomas = '',
        // arrays opcionales
        servicios,
        horarios,
      } = (req.body ?? {}) as Record<string, any>

      const result = await prisma.$transaction(async (tx) => {
        // upsert perfil
        const perfil = await tx.perfilBarbero.upsert({
          where: { usuarioId: userId },
          create: {
            usuarioId: userId,
            nombres,
            apellidos,
            telefono,
            nacimiento: parseDate(nacimiento),
            region,
            comuna,
            ciudad,
            direccion,
            avatarUrl,
            nombreBarberia,
            descripcion,
            experiencia: Number(experiencia) || 0,
            especialidades,
            idiomas,
          },
          update: {
            nombres,
            apellidos,
            telefono,
            nacimiento: parseDate(nacimiento),
            region,
            comuna,
            ciudad,
            direccion,
            avatarUrl,
            nombreBarberia,
            descripcion,
            experiencia: Number(experiencia) || 0,
            especialidades,
            idiomas,
          },
          select: { id: true },
        })

        // reconciliar SERVICIOS si vienen en el payload
        if (Array.isArray(servicios)) {
          const keepIds = servicios.filter((s: any) => s.id).map((s: any) => Number(s.id))
          await tx.servicio.deleteMany({
            where: {
              barberoId: perfil.id,
              ...(keepIds.length ? { id: { notIn: keepIds } } : {}),
            },
          })

          for (const s of servicios) {
            const nombre = String(s.nombre ?? '').trim()
            const precio = Number(s.precio) || 0
            if (!nombre) continue

            if (s.id) {
              await tx.servicio.update({
                where: { id: Number(s.id) },
                data: { nombre, precio },
              })
            } else {
              await tx.servicio.create({
                data: { barberoId: perfil.id, nombre, precio, duracion: Number(s.duracion) || 60 },
              })
            }
          }
        }

        // reconciliar HORARIOS si vienen en el payload
        if (Array.isArray(horarios)) {
          const keepIds = horarios.filter((h: any) => h.id).map((h: any) => Number(h.id))
          await tx.horario.deleteMany({
            where: {
              barberoId: perfil.id,
              ...(keepIds.length ? { id: { notIn: keepIds } } : {}),
            },
          })

          for (const h of horarios) {
            const dia = String(h.dia ?? '').trim()
            const inicio = String(h.inicio ?? '').trim()
            const fin = String(h.fin ?? '').trim()
            const pausaInicio = h.pausaInicio ? String(h.pausaInicio).trim() : null
            const pausaFin = h.pausaFin ? String(h.pausaFin).trim() : null
            if (!dia || !inicio || !fin) continue

            if (h.id) {
              await tx.horario.update({
                where: { id: Number(h.id) },
                data: { dia, inicio, fin, pausaInicio, pausaFin },
              })
            } else {
              await tx.horario.create({
                data: { barberoId: perfil.id, dia, inicio, fin, pausaInicio, pausaFin },
              })
            }
          }
        }

        // devolver perfil actualizado con servicios y horarios
        const updated = await tx.perfilBarbero.findUnique({
          where: { usuarioId: userId },
          select: {
            id: true,
            usuarioId: true,
            avatarUrl: true,
            nombres: true,
            apellidos: true,
            telefono: true,
            nacimiento: true,
            nombreBarberia: true,
            descripcion: true,
            experiencia: true,
            region: true,
            comuna: true,
            ciudad: true,
            direccion: true,
            especialidades: true,
            idiomas: true,
            servicios: { select: { id: true, nombre: true, precio: true } },
            horarios: {
              select: { id: true, dia: true, inicio: true, fin: true, pausaInicio: true, pausaFin: true },
              orderBy: { id: 'asc' },
            },
          },
        })

        return updated
      })

      return res.status(200).json({
        success: true,
        perfil: {
          ...result,
          nacimiento: result?.nacimiento ? result.nacimiento.toISOString() : new Date().toISOString(),
        },
      })
    } catch (e) {
      console.error('PATCH /barbero/perfil error:', e)
      return res.status(500).json({ error: 'Error guardando perfil' })
    }
  }
}
